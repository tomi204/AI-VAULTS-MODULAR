// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mock WBTC Token
/// @notice Mock WBTC token for testing and Flow deployment
/// @dev Mimics the real WBTC token with 8 decimals
contract MockWBTC is ERC20, Ownable {
    uint8 private constant DECIMALS = 8;
    uint256 private constant INITIAL_SUPPLY = 21_000_000 * 10 ** DECIMALS; // 21M WBTC (Bitcoin max supply)

    constructor() ERC20("Wrapped Bitcoin", "WBTC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Mint new tokens (only owner)
    /// @param to Address to mint to
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from caller
    /// @param amount Amount to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Faucet function for testing (anyone can call)
    /// @param amount Amount to mint to caller (max 1 WBTC)
    function faucet(uint256 amount) external {
        require(
            amount <= 1 * 10 ** DECIMALS,
            "MockWBTC: Max 1 WBTC per faucet"
        );
        _mint(msg.sender, amount);
    }
}
