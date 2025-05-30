# MultiTokenVault Deployment Guide

## Environment Variables

Create a `.env` file with the following variables:

### Required Variables

```bash
# Pyth Network contract address (varies by blockchain)
PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c69C6

# USDC contract address (underlying asset for the vault)
USDC_ADDRESS=0xA0b86a33E6441EeA8D9e08ec38a9c87C16fC77c4
```

### Optional Variables

```bash
# BTC token address (e.g., WBTC) - if not set, BTC won't be configured
BTC_TOKEN_ADDRESS=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599

# ETH token address (e.g., WETH) - if not set, ETH won't be configured
ETH_TOKEN_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

## Network Configurations

### Ethereum Mainnet

```bash
PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c69C6
USDC_ADDRESS=0xA0b86a33E6441EeA8D9e08ec38a9c87C16fC77c4
BTC_TOKEN_ADDRESS=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599  # WBTC
ETH_TOKEN_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  # WETH
```

### Arbitrum

```bash
PYTH_ADDRESS=0xff1a0f4744e8582DF1aE09D5611b887B6a12925C
USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
BTC_TOKEN_ADDRESS=0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f  # WBTC
ETH_TOKEN_ADDRESS=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1  # WETH
```

### Base

```bash
PYTH_ADDRESS=0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
# Add BTC/ETH token addresses for Base network
```

## Price IDs (Hardcoded in Script)

The following Pyth price IDs are used:

- **BTC/USD**: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **ETH/USD**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`

## Deployment Commands

### Deploy to localhost

```bash
npx hardhat run scripts/deployMultiTokenVault.ts --network localhost
```

### Deploy to Ethereum Mainnet

```bash
npx hardhat run scripts/deployMultiTokenVault.ts --network ethereum
```

### Deploy to Arbitrum

```bash
npx hardhat run scripts/deployMultiTokenVault.ts --network arbitrum
```

## Example Output

```
=== Configuration ===
USDC: 0xA0b86a33E6441EeA8D9e08ec38a9c87C16fC77c4
Pyth: 0x4305FB66699C3B2702D4d05CF36551390A4c69C6
BTC Token: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
ETH Token: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

=== Deploying MultiTokenVault ===
✅ MultiTokenVault deployed to: 0x1234...

=== Configuring Accepted Tokens ===
✅ USDC configured (1:1, no oracle)
✅ BTC token configured: 0x2260...
✅ ETH token configured: 0xC02a...

=== Deployment Summary ===
🏦 MultiTokenVault: 0x1234...
💰 Underlying Asset: USDC (0xA0b8...)
🔮 Oracle: Pyth (0x4305...)
👨‍💼 Manager: 0xdeployer...
🤖 Agent: 0xdeployer...
```

## Usage

After deployment, users can:

- **Deposit USDC**: 1:1 conversion to vault shares (no oracle needed)
- **Deposit BTC/ETH tokens**: Pyth oracle conversion to USDC equivalent shares
- **Withdraw**: Only USDC (ERC4626 standard)
- **Earn yield**: Through strategy execution

## Contract Functions

```solidity
// Deposit any supported token
vault.depositToken(tokenAddress, amount, receiver);

// Standard ERC4626 functions for USDC
vault.deposit(usdcAmount, receiver);
vault.withdraw(usdcAmount, receiver, owner);

// Strategy management (Manager role)
vault.configureToken(tokenAddress, priceId, decimals);
vault.addStrategy(strategyAddress);

// Strategy execution (Agent role)
vault.executeStrategy(strategyAddress, data);
vault.depositToStrategy(strategyAddress, amount, data);
```
