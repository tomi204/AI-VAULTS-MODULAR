// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Vault Contract
/// @notice This contract implements an ERC4626 vault with role-based access control
/// @dev Extends ERC4626 for vault functionality, Ownable for ownership, and AccessControl for role management
contract Vault is Ownable, ERC4626, AccessControl {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    /// @notice Role identifier for vault managers
    /// @dev Used in AccessControl for manager permissions
    bytes32 public constant MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");

    /// @notice Role identifier for vault agents
    /// @dev Used in AccessControl for agent permissions
    bytes32 public constant AGENT_ROLE = keccak256("VAULT_ADMIN_ROLE");

    /// @notice Strategies address
    address[] public strategies;

    /// @notice Strategies address
    mapping(address => bool) public isStrategy;

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

    function addStrategy(address strategy) external onlyManager {
        require(strategy != address(0), "Strategy cannot be zero address");
        require(!isStrategy[strategy], "Strategy already exists");
        isStrategy[strategy] = true;
        strategies.push(strategy);
    }

    function removeStrategy(address strategy) external onlyManager {
        require(isStrategy[strategy], "Strategy does not exist");
        isStrategy[strategy] = false;
        strategies.push(strategy);
    }

    function executeStrategy(
        address strategy,
        bytes calldata data
    ) external onlyAgent {
        require(isStrategy[strategy], "Strategy does not exist");
        (bool success, ) = strategy.call(data);
        require(success, "Strategy execution failed");
    }

    // ============ Internal Functions ============
}
