// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "./interfaces/Strategies.sol";

/// @title MultiTokenVault Contract
/// @notice Multi-token vault that accepts ERC20s and converts value to USDC using Pyth oracle
/// @dev Extends ERC4626 with USDC as underlying asset, accepts multiple ERC20 tokens for deposits
contract MultiTokenVault is Ownable, ERC4626, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    /// @notice Pyth oracle contract
    IPyth public immutable pyth;

    /// @notice Token configuration
    struct TokenConfig {
        bytes32 priceId; // Pyth price ID
        uint8 decimals; // Token decimals
        bool isAccepted; // Whether token is accepted for deposits
    }

    /// @notice Mapping of accepted tokens for deposits
    mapping(address => TokenConfig) public acceptedTokens;

    /// @notice Array of accepted token addresses
    address[] public acceptedTokensList;

    /// @notice Strategies
    address[] public strategies;
    mapping(address => bool) public isStrategy;

    /// @notice Maximum age for price feeds (25 minutes)
    uint256 public constant MAX_PRICE_AGE = 1500;

    // ============ Events ============

    event MultiTokenDeposit(
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 usdcEquivalent,
        uint256 shares
    );
    event TokenConfigured(
        address indexed token,
        bytes32 priceId,
        uint8 decimals
    );
    event TokenRemoved(address indexed token);
    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event StrategyExecuted(address indexed strategy, bytes data);

    // ============ Errors ============

    error TokenNotAccepted();
    error InvalidAmount();
    error PriceStale();
    error InvalidStrategy();
    error StrategyAlreadyExists();
    error StrategyDoesNotExist();
    error ExecutionFailed();
    error InvalidAddress();
    error InsufficientBalance();

    // ============ Modifiers ============

    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, msg.sender),
            "MultiTokenVault: caller is not a manager"
        );
        _;
    }

    modifier onlyAgent() {
        require(
            hasRole(AGENT_ROLE, msg.sender),
            "MultiTokenVault: caller is not an agent"
        );
        _;
    }

    // ============ Constructor ============

    constructor(
        address _usdc,
        address manager,
        address agent,
        address _pyth,
        string memory _name,
        string memory _symbol
    ) ERC4626(IERC20(_usdc)) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(
            _usdc != address(0) &&
                manager != address(0) &&
                agent != address(0) &&
                _pyth != address(0),
            "Zero address"
        );

        pyth = IPyth(_pyth);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, manager);
        _grantRole(AGENT_ROLE, agent);
    }

    // ============ Multi-Token Deposit Functions ============

    /// @notice Deposit ERC20 token, automatically converts to USDC equivalent for shares
    /// @param token Token address (ERC20 only)
    /// @param tokenAmount Amount of tokens to deposit
    /// @param receiver Address to receive vault shares
    /// @return shares Amount of shares minted
    function depositToken(
        address token,
        uint256 tokenAmount,
        address receiver
    ) external nonReentrant returns (uint256 shares) {
        if (token == address(0)) revert TokenNotAccepted(); // No native ETH
        if (tokenAmount == 0) revert InvalidAmount();

        // Special case for USDC - use standard ERC4626 deposit
        if (token == asset()) {
            return deposit(tokenAmount, receiver);
        }

        // For other tokens, check if accepted and convert via oracle
        TokenConfig memory config = acceptedTokens[token];
        if (!config.isAccepted) revert TokenNotAccepted();

        // Transfer token from user to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Get token price from Pyth oracle
        PythStructs.Price memory tokenPrice = pyth.getPriceNoOlderThan(
            config.priceId,
            MAX_PRICE_AGE
        );

        // Convert to USDC equivalent value
        uint256 usdcEquivalent = _convertToUSDC(
            tokenAmount,
            tokenPrice,
            config.decimals
        );

        // Mint shares based on USDC equivalent value (using ERC4626 logic)
        shares = previewDeposit(usdcEquivalent);
        _mint(receiver, shares);

        // Update total assets manually since we didn't deposit the underlying asset
        // Note: This is a simplified approach. In production, you'd want to swap the token for USDC

        emit MultiTokenDeposit(
            msg.sender,
            token,
            tokenAmount,
            usdcEquivalent,
            shares
        );
    }

    /// @notice Convert token amount to USDC equivalent using Pyth price
    function _convertToUSDC(
        uint256 tokenAmount,
        PythStructs.Price memory price,
        uint8 tokenDecimals
    ) internal pure returns (uint256 usdcAmount) {
        if (price.price <= 0) revert PriceStale();

        // Calculate: (tokenAmount * price * 10^6) / (10^tokenDecimals * 10^|expo|)
        // Result in USDC equivalent (6 decimals)
        uint256 priceDecimals = price.expo < 0
            ? uint256(int256(-price.expo))
            : uint256(int256(price.expo));

        uint256 rawPrice = uint256(uint64(price.price));

        // Normalize to USDC decimals (6)
        usdcAmount =
            (tokenAmount * rawPrice * 1e6) /
            (10 ** tokenDecimals * 10 ** priceDecimals);

        return usdcAmount;
    }

    // ============ Token Configuration ============

    /// @notice Configure accepted token for deposits
    /// @param token Token address (ERC20 only, no address(0))
    /// @param priceId Pyth price ID (can be 0x0 for USDC)
    /// @param decimals Token decimals
    function configureToken(
        address token,
        bytes32 priceId,
        uint8 decimals
    ) external onlyManager {
        if (token == address(0)) revert InvalidAddress(); // No native ETH

        if (!acceptedTokens[token].isAccepted) {
            acceptedTokensList.push(token);
        }

        acceptedTokens[token] = TokenConfig({
            priceId: priceId, // Can be 0x0 for USDC since no conversion needed
            decimals: decimals > 0 ? decimals : _getTokenDecimals(token),
            isAccepted: true
        });

        emit TokenConfigured(token, priceId, decimals);
    }

    /// @notice Remove token from accepted list
    /// @param token Token address to remove
    function removeToken(address token) external onlyManager {
        if (!acceptedTokens[token].isAccepted) revert TokenNotAccepted();

        acceptedTokens[token].isAccepted = false;

        // Remove from array
        for (uint256 i = 0; i < acceptedTokensList.length; i++) {
            if (acceptedTokensList[i] == token) {
                acceptedTokensList[i] = acceptedTokensList[
                    acceptedTokensList.length - 1
                ];
                acceptedTokensList.pop();
                break;
            }
        }

        emit TokenRemoved(token);
    }

    // ============ Strategy Functions (from original Vault) ============

    function addStrategy(address strategy) external onlyManager {
        if (strategy == address(0)) revert InvalidAddress();
        if (isStrategy[strategy]) revert StrategyAlreadyExists();

        isStrategy[strategy] = true;
        strategies.push(strategy);

        emit StrategyAdded(strategy);
    }

    function removeStrategy(address strategy) external onlyManager {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        isStrategy[strategy] = false;

        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }

        emit StrategyRemoved(strategy);
    }

    function executeStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        (bool success, ) = strategy.call(data);
        if (!success) revert ExecutionFailed();

        emit StrategyExecuted(strategy, data);
    }

    function depositToStrategy(
        address strategy,
        uint256 amount,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();
        if (amount == 0) revert InvalidAmount();

        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (vaultBalance < amount) revert InsufficientBalance();

        IERC20(asset()).approve(strategy, amount);
        IStrategies(strategy).execute(amount, data);

        emit StrategyExecuted(strategy, data);
    }

    function harvestStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        IStrategies(strategy).harvest(data);

        emit StrategyExecuted(strategy, data);
    }

    function emergencyExitStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        IStrategies(strategy).emergencyExit(data);

        emit StrategyExecuted(strategy, data);
    }

    // ============ View Functions ============

    /// @notice Get all accepted tokens
    function getAcceptedTokens() external view returns (address[] memory) {
        return acceptedTokensList;
    }

    /// @notice Preview USDC equivalent for token amount
    function previewTokenDeposit(
        address token,
        uint256 tokenAmount
    ) external view returns (uint256 usdcEquivalent) {
        // Special case for USDC - no conversion needed (1:1)
        if (token == asset()) {
            return tokenAmount;
        }

        TokenConfig memory config = acceptedTokens[token];
        if (!config.isAccepted) revert TokenNotAccepted();

        PythStructs.Price memory tokenPrice = pyth.getPriceNoOlderThan(
            config.priceId,
            MAX_PRICE_AGE
        );
        return _convertToUSDC(tokenAmount, tokenPrice, config.decimals);
    }

    /// @notice Check if roles are assigned correctly
    function hasManagerRole(address account) external view returns (bool) {
        return hasRole(MANAGER_ROLE, account);
    }

    function hasAgentRole(address account) external view returns (bool) {
        return hasRole(AGENT_ROLE, account);
    }

    // ============ Internal Functions ============

    function _getTokenDecimals(address token) internal view returns (uint8) {
        try IERC20Metadata(token).decimals() returns (uint8 d) {
            return d;
        } catch {
            return 18; // Default fallback
        }
    }

    // ============ No ETH Support ============

    receive() external payable {
        revert("ERC20 tokens only");
    }
}
