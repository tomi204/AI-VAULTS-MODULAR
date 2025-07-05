// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interfaces/Strategies.sol";
import {TablelandDeployments} from "@tableland/evm/contracts/utils/TablelandDeployments.sol";
import {SQLHelpers} from "@tableland/evm/contracts/utils/SQLHelpers.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Vault Contract
/// @notice This contract implements an ERC4626 vault with role-based access control
/// @dev Extends ERC4626 for vault functionality, Ownable for ownership, and AccessControl for role management
contract Vault is Ownable, ERC4626, AccessControl, IERC721Receiver {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    /// @notice Role identifier for vault managers
    /// @dev Used in AccessControl for manager permissions
    bytes32 public constant MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");
    // Store relevant table info
    uint256 private _tableId; // Unique table ID
    string private constant _TABLE_PREFIX = "ai_movements"; // Custom table prefix

    /// @notice Role identifier for vault agents
    /// @dev Used in AccessControl for agent permissions
    bytes32 public constant AGENT_ROLE = keccak256("VAULT_ADMIN_ROLE");

    /// @notice Strategies address
    address[] public strategies;

    /// @notice Strategies address
    mapping(address => bool) public isStrategy;

    // ============ Events ============
    event TableCreated(uint256 indexed tableId);
    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event StrategyExecuted(address indexed strategy, bytes data);
    event StrategyHarvested(address indexed strategy, bytes data);
    event EmergencyExit(address indexed strategy, bytes data);

    // ============ Errors ============
    error InvalidStrategy();
    error StrategyAlreadyExists();
    error StrategyDoesNotExist();
    error ExecutionFailed();
    error InvalidAddress();
    error InsufficientBalance();

    // ============ Modifiers ============
    /// @notice Restricts function access to addresses with MANAGER_ROLE
    /// @dev Reverts if caller doesn't have MANAGER_ROLE
    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, msg.sender),
            "Vault: caller is not a manager"
        );
        _;
    }

    /// @notice Restricts function access to addresses with AGENT_ROLE
    /// @dev Reverts if caller doesn't have AGENT_ROLE
    modifier onlyAgent() {
        require(
            hasRole(AGENT_ROLE, msg.sender),
            "Vault: caller is not an agent"
        );
        _;
    }

    // ============ Constructor ============
    /// @notice Initializes the vault with the underlying asset and token details
    /// @dev Sets up initial roles and initializes ERC4626 and ERC20
    /// @param _asset The underlying ERC20 token
    /// @param _name Name of the vault token
    /// @param _symbol Symbol of the vault token
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address manager,
        address agent
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(manager != address(0), "Manager cannot be zero address");
        require(agent != address(0), "Agent cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, manager);
        _grantRole(AGENT_ROLE, agent);
    }

    // ============ External Functions ============
    /**
     * @dev Adds a new strategy to the vault
     * @param strategy The address of the strategy to add
     */
    function addStrategy(address strategy) external onlyManager {
        if (strategy == address(0)) revert InvalidAddress();
        if (isStrategy[strategy]) revert StrategyAlreadyExists();

        isStrategy[strategy] = true;
        strategies.push(strategy);

        emit StrategyAdded(strategy);
    }

    /**
     * @dev Removes a strategy from the vault
     * @param strategy The address of the strategy to remove
     */
    function removeStrategy(address strategy) external onlyManager {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        isStrategy[strategy] = false;

        // Remove from array
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }

        emit StrategyRemoved(strategy);
    }

    /**
     * @dev Executes a strategy with the given data
     * @param strategy The address of the strategy to execute
     * @param data The data to pass to the strategy
     */
    function executeStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        (bool success, ) = strategy.call(data);
        if (!success) revert ExecutionFailed();

        emit StrategyExecuted(strategy, data);
    }

    /**
     * @dev Deposits assets to a strategy and executes it
     * @param strategy The address of the strategy to deposit to
     * @param reason The reason for this deposit
     * @param updatedAt The timestamp of this operation
     * @param riskLevel The risk level of this operation
     * @param amount The amount of assets to deposit
     * @param data Additional data for the strategy execution
     */
    function depositToStrategy(
        address strategy,
        string memory reason,
        string memory updatedAt,
        string memory riskLevel,
        uint256 amount,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();
        if (amount == 0) revert InvalidAddress(); // Reusing error for zero amount

        // Check vault has enough assets
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (vaultBalance < amount) revert InsufficientBalance();

        // Approve strategy to spend vault's tokens
        IERC20(asset()).approve(strategy, amount);

        // Call strategy execute function
        IStrategies(strategy).execute(amount, data);

        // Only perform Tableland operations if table has been created
        if (_tableId > 0) {
            // Prepare values for Tableland insertion
            string memory strategyHex = Strings.toHexString(strategy);
            string memory amountStr = Strings.toString(amount);
            string memory tableIdStr = Strings.toString(_tableId);

            // Insert into table
            TablelandDeployments.get().mutate(
                address(this), // Table owner, i.e., this contract
                _tableId,
                SQLHelpers.toInsert(
                    _TABLE_PREFIX,
                    _tableId,
                    "id,strategy_address,reason,updated_at,amount,risk_level",
                    string.concat(
                        tableIdStr,
                        ",",
                        SQLHelpers.quote(strategyHex),
                        ",",
                        SQLHelpers.quote(reason),
                        ",",
                        SQLHelpers.quote(updatedAt),
                        ",",
                        SQLHelpers.quote(amountStr),
                        ",",
                        SQLHelpers.quote(riskLevel)
                    )
                )
            );
        }

        emit StrategyExecuted(strategy, data);
    }

    /**
     * @dev Harvests rewards from a strategy
     * @param strategy The address of the strategy to harvest from
     * @param data The data to pass to the strategy
     */
    function harvestStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        IStrategies(strategy).harvest(data);

        emit StrategyHarvested(strategy, data);
    }

    /**
     * @dev Performs an emergency exit from a strategy
     * @param strategy The address of the strategy to exit
     * @param data The data to pass to the strategy
     */
    function emergencyExitStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        if (!isStrategy[strategy]) revert StrategyDoesNotExist();

        IStrategies(strategy).emergencyExit(data);

        emit EmergencyExit(strategy, data);
    }

    /// ============ Tableland Functions ============

    /**
     * @dev Creates a simple table with an `id` and `val` column
     */
    function createTable() public payable onlyOwner {
        _tableId = TablelandDeployments.get().create(
            address(this),
            SQLHelpers.toCreateFromSchema(
                "id integer primary key,"
                "strategy_address text,"
                "reason text,"
                "updated_at text,"
                "amount text,"
                "risk_level text",
                _TABLE_PREFIX
            )
        );
        emit TableCreated(_tableId);
    }

    /**
     * @dev Required for the contract to own a table
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // ============ ERC4626 Functions ============
    /**
     * @dev See {IERC4626-deposit}
     */
    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256) {
        return super.deposit(assets, receiver);
    }

    /**
     * @dev See {IERC4626-mint}
     */
    function mint(
        uint256 shares,
        address receiver
    ) public override returns (uint256) {
        return super.mint(shares, receiver);
    }

    /**
     * @dev See {IERC4626-withdraw}
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override returns (uint256) {
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @dev See {IERC4626-redeem}
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        return super.redeem(shares, receiver, owner);
    }

    // ============ View Functions ============
    /**
     * @dev Returns whether an address has the manager role
     * @param account The address to check
     * @return bool Whether the address has the manager role
     */
    function hasManagerRole(address account) external view returns (bool) {
        return hasRole(MANAGER_ROLE, account);
    }

    /**
     * @dev Returns whether an address has the agent role
     * @param account The address to check
     * @return bool Whether the address has the agent role
     */
    function hasAgentRole(address account) external view returns (bool) {
        return hasRole(AGENT_ROLE, account);
    }
}
