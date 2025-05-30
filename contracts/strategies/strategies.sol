// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title GenericStrategyImplementation
 * @dev Implementation of the IStrategy interface that can interact with any protocol via function selectors
 * @notice This is a generic implementation that can be reused for multiple protocols
 * @custom:security-contact security@vaults.com
 */
contract Strategies is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State variables - immutable for gas optimization
    address public immutable underlyingToken;
    address public immutable protocol;
    bytes4 public immutable depositSelector;
    bytes4 public immutable withdrawSelector;
    bytes4 public immutable claimSelector;
    bytes4 public immutable getBalanceSelector;

    // Mutable state
    address public vault;
    bool public paused;

    // Optional secondary token mappings for rewards and protocol tokens
    mapping(address => bool) public knownRewardTokens;
    address[] public rewardTokensList;

    // Events
    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Claim(uint256 amount);
    event VaultSet(address vault);
    event PausedState(bool isPaused);
    event Executed(uint256 amount, bytes data);
    event Harvested(bytes data);
    event EmergencyExited(uint256 balance, bytes data);
    event RewardTokenAdded(address indexed token);
    event TokensForwarded(address indexed token, uint256 amount);
    event ClaimRewardsFailed(bytes reason);

    // Errors
    error NoVaultSet();
    error StrategyPaused();
    error DepositFailed(bytes reason);
    error WithdrawFailed(bytes reason);
    error ClaimFailed(bytes reason);
    error GetBalanceFailed(bytes reason);
    error NoUnderlyingBalance();
    error InvalidTokenAddress();
    error InvalidAmount();

    // Modifiers
    modifier onlyAgent() {
        if (vault == address(0)) revert NoVaultSet();
        if (msg.sender != vault) {
            revert("Only agent can call");
        }
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert StrategyPaused();
        _;
    }

    /**
     * @dev Constructor for initializing the strategy
     * @param _underlyingToken Address of the underlying token
     * @param _protocol Address of the protocol
     * @param _depositSelector Function selector for deposit
     * @param _withdrawSelector Function selector for withdraw
     * @param _claimSelector Function selector for claim
     * @param _getBalanceSelector Function selector for getBalance
     */
    constructor(
        address _underlyingToken,
        address _protocol,
        bytes4 _depositSelector,
        bytes4 _withdrawSelector,
        bytes4 _claimSelector,
        bytes4 _getBalanceSelector
    ) {
        require(_underlyingToken != address(0), "Invalid token address");
        require(_protocol != address(0), "Invalid protocol address");

        underlyingToken = _underlyingToken;
        protocol = _protocol;
        depositSelector = _depositSelector;
        withdrawSelector = _withdrawSelector;
        claimSelector = _claimSelector;
        getBalanceSelector = _getBalanceSelector;
    }

    /**
     * @dev Sets the vault address
     * @param _vault Address of the vault
     * @notice This can only be set once for security reasons
     */
    function setVault(address _vault) external {
        require(_vault != address(0), "Invalid vault address");
        require(vault == address(0), "Vault already set");
        vault = _vault;
        emit VaultSet(_vault);
    }

    /**
     * @dev Add a known reward token to track
     * @param tokenAddress Address of the reward token
     * @notice This helps the strategy automatically track and forward reward tokens
     */
    function addRewardToken(address tokenAddress) external onlyAgent {
        require(tokenAddress != address(0), "Invalid token address");
        require(!knownRewardTokens[tokenAddress], "Token already added");

        knownRewardTokens[tokenAddress] = true;
        rewardTokensList.push(tokenAddress);
        emit RewardTokenAdded(tokenAddress);
    }

    /**
     * @dev Executes the strategy by depositing tokens into the protocol
     * @param amount Amount of tokens to deposit
     * @param data Additional data needed for the deposit
     * @notice This function handles the transfer of tokens and interaction with the protocol
     */
    function execute(
        uint256 amount,
        bytes calldata data
    ) external onlyAgent nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        // Record token balances before execution
        uint256 underlyingBalanceBefore = IERC20(underlyingToken).balanceOf(
            address(this)
        );

        // Handle the token transfer first
        IERC20(underlyingToken).safeTransferFrom(vault, address(this), amount);

        // Approve protocol to spend tokens - optimized to clear only if needed
        uint256 currentAllowance = IERC20(underlyingToken).allowance(
            address(this),
            protocol
        );
        if (currentAllowance < amount) {
            if (currentAllowance > 0) {
                IERC20(underlyingToken).forceApprove(protocol, 0);
            }
            IERC20(underlyingToken).forceApprove(protocol, amount);
        }

        // Build calldata for the protocol interaction
        bytes memory callData;
        if (data.length > 0) {
            // Use provided data if available
            callData = data;
        } else {
            // Build default calldata using the deposit selector
            // This supports protocols with different parameter configurations

            // Handle protocols with simple deposit(uint256)
            if (bytes4(keccak256("deposit(uint256)")) == depositSelector) {
                callData = abi.encodeWithSelector(depositSelector, amount);
            }
            // Handle protocols with deposit(address,uint256,address,uint16) like Aave
            else if (
                bytes4(keccak256("deposit(address,uint256,address,uint16)")) ==
                depositSelector ||
                bytes4(keccak256("supply(address,uint256,address,uint16)")) ==
                depositSelector
            ) {
                callData = abi.encodeWithSelector(
                    depositSelector,
                    underlyingToken,
                    amount,
                    address(this),
                    0 // referralCode
                );
            }
            // Handle protocols with deposit(address,uint256,address) like Compound
            else if (
                bytes4(keccak256("deposit(address,uint256,address)")) ==
                depositSelector
            ) {
                callData = abi.encodeWithSelector(
                    depositSelector,
                    underlyingToken,
                    amount,
                    address(this)
                );
            }
            // Default fallback - attempt to encode with minimal params
            else {
                callData = abi.encodeWithSelector(depositSelector, amount);
            }
        }

        // Execute the deposit with gas optimization - no memory expansion in the hot path
        bool success;
        bytes memory result;
        (success, result) = protocol.call(callData);

        // Handle failure with minimal gas usage
        if (!success) {
            // Revoke approval for security
            IERC20(underlyingToken).forceApprove(protocol, 0);

            // Extract error message with minimal gas
            bytes memory revertReason;
            if (result.length > 0) {
                assembly {
                    revertReason := add(result, 0x20)
                }
            }
            revert DepositFailed(revertReason);
        }

        // Verify tokens were actually transferred - important for security
        uint256 underlyingBalanceAfter = IERC20(underlyingToken).balanceOf(
            address(this)
        );
        if (underlyingBalanceAfter > underlyingBalanceBefore) {
            uint256 difference = underlyingBalanceAfter -
                underlyingBalanceBefore;
            if (difference < amount) {
                // Some tokens remained, adjust approval for security
                IERC20(underlyingToken).forceApprove(protocol, 0);
            }
        }

        // Forward any reward tokens that might have been received
        _forwardRewardTokens();

        emit Deposit(amount);
        emit Executed(amount, data);
    }

    /**
     * @dev Harvests rewards from the protocol
     * @param data Additional data needed for harvesting
     */
    function harvest(bytes calldata data) external onlyAgent nonReentrant {
        claimRewards(data);
        emit Harvested(data);
    }

    /**
     * @dev Gets the current balance of the strategy in the protocol
     * @return uint256 Balance of the strategy
     * @notice This function retrieves the protocol balance using the appropriate method for the protocol
     */
    function getBalance() public view returns (uint256) {
        // If no protocol or no token, return 0
        if (protocol == address(0) || underlyingToken == address(0)) {
            return 0;
        }

        // Gas-optimized balance retrieval cascade
        // Try the different protocol interfaces in a gas-efficient manner

        // 1. Try direct static call without parameters (most common)
        (bool success, bytes memory result) = protocol.staticcall(
            abi.encodeWithSelector(getBalanceSelector)
        );

        if (success && result.length >= 32) {
            return abi.decode(result, (uint256));
        }

        // 2. Try with token and address parameters
        (success, result) = protocol.staticcall(
            abi.encodeWithSelector(
                getBalanceSelector,
                underlyingToken,
                address(this)
            )
        );

        if (success && result.length >= 32) {
            return abi.decode(result, (uint256));
        }

        // 3. Try to handle Aave-like protocols
        // These typically use the aToken pattern
        (success, result) = protocol.staticcall(
            abi.encodeWithSelector(
                bytes4(keccak256("getAToken(address)")),
                underlyingToken
            )
        );

        if (success && result.length >= 32) {
            address aToken = abi.decode(result, (address));
            if (aToken != address(0)) {
                return IERC20(aToken).balanceOf(address(this));
            }
        }

        // Return 0 as last resort - safe in view functions
        return 0;
    }

    /**
     * @dev Performs an emergency exit, withdrawing all funds from the protocol
     * @param data Additional data needed for emergency exit
     */
    function emergencyExit(
        bytes calldata data
    ) external onlyAgent nonReentrant {
        // Get balance from protocol
        uint256 balance = getBalance();

        if (balance == 0) {
            revert NoUnderlyingBalance();
        }

        // Build calldata for withdraw with optimal protocol pattern matching
        bytes memory callData;

        if (data.length > 0) {
            // Use provided data if available - highest priority
            callData = data;
        } else {
            // Handle different protocol interfaces

            // Handle basic withdraw(uint256)
            if (bytes4(keccak256("withdraw(uint256)")) == withdrawSelector) {
                callData = abi.encodeWithSelector(withdrawSelector, balance);
            }
            // Handle withdraw(address,uint256,address) like Aave
            else if (
                bytes4(keccak256("withdraw(address,uint256,address)")) ==
                withdrawSelector
            ) {
                callData = abi.encodeWithSelector(
                    withdrawSelector,
                    underlyingToken,
                    balance,
                    address(this)
                );
            }
            // Handle withdraw(uint256,address) like some protocols
            else if (
                bytes4(keccak256("withdraw(uint256,address)")) ==
                withdrawSelector
            ) {
                callData = abi.encodeWithSelector(
                    withdrawSelector,
                    balance,
                    address(this)
                );
            }
            // Default fallback with minimal params
            else {
                callData = abi.encodeWithSelector(withdrawSelector, balance);
            }
        }

        // Execute the withdraw with maximal gas efficiency
        bool success;
        bytes memory result;
        (success, result) = protocol.call(callData);

        // Handle failure efficiently
        if (!success) {
            bytes memory revertReason;
            if (result.length > 0) {
                assembly {
                    revertReason := add(result, 0x20)
                }
            }
            revert WithdrawFailed(revertReason);
        }

        // Transfer tokens to the vault
        uint256 tokenBalance = IERC20(underlyingToken).balanceOf(address(this));
        if (tokenBalance > 0) {
            IERC20(underlyingToken).safeTransfer(vault, tokenBalance);
        }

        emit Withdraw(balance);
        emit EmergencyExited(balance, data);
    }

    /**
     * @dev Claims rewards from the protocol
     * @param data Additional data needed for claiming rewards
     */
    function claimRewards(bytes calldata data) public onlyAgent nonReentrant {
        // Skip if claimSelector is not set
        if (claimSelector == bytes4(0)) {
            return;
        }

        // Build calldata for claim with optimal pattern matching
        bytes memory callData;

        if (data.length > 0) {
            // Use provided data if available
            callData = data;
        } else {
            // Handle different protocol interfaces

            // Basic claim() with no params
            if (bytes4(keccak256("claim()")) == claimSelector) {
                callData = abi.encodeWithSelector(claimSelector);
            }
            // claimRewards(address) - most common pattern
            else if (
                bytes4(keccak256("claimRewards(address)")) == claimSelector
            ) {
                callData = abi.encodeWithSelector(claimSelector, address(this));
            }
            // getReward() - common in some protocols
            else if (bytes4(keccak256("getReward()")) == claimSelector) {
                callData = abi.encodeWithSelector(claimSelector);
            }
            // Default with minimal params
            else {
                callData = abi.encodeWithSelector(claimSelector, address(this));
            }
        }

        // Execute the claim with minimal gas usage
        (bool success, bytes memory result) = protocol.call(callData);

        // Handle failure - not critical, just emit event
        if (!success) {
            bytes memory revertReason;
            if (result.length > 0) {
                assembly {
                    revertReason := add(result, 0x20)
                }
            }
            emit ClaimRewardsFailed(revertReason);
            return;
        }

        // Forward reward tokens with optimal gas usage
        _forwardRewardTokens();

        emit Claim(0);
    }

    /**
     * @dev Internal helper to detect and forward Aave reward tokens
     * @notice Gas optimized for Aave protocol compatibility
     */
    function _detectAndForwardAaveRewards() internal {
        // Try to get the reward token address from the protocol
        (bool success, bytes memory returnData) = protocol.staticcall(
            abi.encodeWithSelector(bytes4(keccak256("rewardToken()")))
        );

        if (success && returnData.length >= 32) {
            address rewardTokenAddress = abi.decode(returnData, (address));

            if (rewardTokenAddress != address(0)) {
                // Add it to known tokens if not already there
                if (!knownRewardTokens[rewardTokenAddress]) {
                    knownRewardTokens[rewardTokenAddress] = true;
                    rewardTokensList.push(rewardTokenAddress);
                    emit RewardTokenAdded(rewardTokenAddress);
                }

                // Forward any balance with minimal gas overhead
                uint256 rewardBalance = IERC20(rewardTokenAddress).balanceOf(
                    address(this)
                );
                if (rewardBalance > 0) {
                    IERC20(rewardTokenAddress).safeTransfer(
                        vault,
                        rewardBalance
                    );
                    emit TokensForwarded(rewardTokenAddress, rewardBalance);
                }
            }
        }
    }

    /**
     * @dev Forward all known reward tokens to the vault
     * @notice Gas optimized by avoiding unnecessary operations
     */
    function _forwardRewardTokens() internal {
        uint256 tokenCount = rewardTokensList.length;

        // Optimize for the common case of few tokens
        for (uint256 i = 0; i < tokenCount; i++) {
            address tokenAddress = rewardTokensList[i];
            uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
            if (balance > 0) {
                IERC20(tokenAddress).safeTransfer(vault, balance);
                emit TokensForwarded(tokenAddress, balance);
            }
        }

        // Try to detect and forward Aave rewards
        _detectAndForwardAaveRewards();
    }

    /**
     * @dev Sets the pause state
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyAgent {
        paused = _paused;
        emit PausedState(_paused);
    }

    /**
     * @dev Query the protocol with custom parameters (read-only)
     * @param selector Function selector to call on the protocol
     * @param params Encoded parameters for the function call
     * @return bytes Raw response data from the protocol
     * @notice This function allows querying any view function in the protocol
     */
    function queryProtocol(
        bytes4 selector,
        bytes calldata params
    ) external view returns (bytes memory) {
        require(protocol != address(0), "Protocol not set");

        // Build calldata combining the selector and parameters
        bytes memory callData = abi.encodePacked(selector, params);

        // Execute the query as a static call (view)
        (bool success, bytes memory result) = protocol.staticcall(callData);

        // Handle failure
        require(success, "Protocol query failed");

        // Return raw results
        return result;
    }
}
