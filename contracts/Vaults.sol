// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vaults is Ownable, ERC4626, AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("VAULT_ADMIN_ROLE");

    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol,
        address manager,
        address agent
    )
        ERC4626(asset, name, symbol)
        Ownable(msg.sender)
        AccessControl(msg.sender)
    {
        require(manager != address(0), "Manager cannot be zero address");
        require(agent != address(0), "Agent cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, manager);
        _grantRole(AGENT_ROLE, agent);
    }
}
