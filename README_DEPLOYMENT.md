# 🚀 MultiTokenVault Deployment Guide

A streamlined deployment system for the MultiTokenVault across any blockchain with Pyth Network integration. This system always deploys fresh mock tokens for consistent testing and development.

## 📋 Prerequisites

- **Node.js** v18+
- **Hardhat** project setup
- **Private key** with native tokens for gas fees
- **Pyth Network address** for your target blockchain

## ⚡ Quick Start

### 1. Environment Setup

```bash
# Clone and install dependencies
git clone <repository>
cd <repository>
npm install

# Setup environment variables
cp env.example .env
```

### 2. Configure Environment

Edit your `.env` file with the required values:

```bash
# Required: Your deployment private key
PRIV_KEY=your_private_key_here

# Required: Pyth oracle address for your target network
FLOW_PYTH_ADDRESS=your_flow_pyth_address
# or
ETHEREUM_PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c69C6
```

### 3. Deploy with One Command

```bash
# Deploy to any supported network
npx hardhat run scripts/deployTokensAndVault.ts --network <NETWORK_NAME>

# Examples:
npx hardhat run scripts/deployTokensAndVault.ts --network flow
npx hardhat run scripts/deployTokensAndVault.ts --network ethereum
npx hardhat run scripts/deployTokensAndVault.ts --network arbitrum
npx hardhat run scripts/deployTokensAndVault.ts --network base
```

## 🌐 Supported Networks

| Network              | Status   | Pyth Oracle     | Mock Tokens     |
| -------------------- | -------- | --------------- | --------------- |
| **Ethereum**         | ✅ Ready | Pre-configured  | Always deployed |
| **Ethereum Sepolia** | ✅ Ready | Pre-configured  | Always deployed |
| **Arbitrum**         | ✅ Ready | Pre-configured  | Always deployed |
| **Arbitrum Sepolia** | ✅ Ready | Pre-configured  | Always deployed |
| **Base**             | ✅ Ready | Pre-configured  | Always deployed |
| **Base Sepolia**     | ✅ Ready | Pre-configured  | Always deployed |
| **Flow**             | ✅ Ready | ⚠️ Needs config | Always deployed |
| **Flow Testnet**     | ✅ Ready | ⚠️ Needs config | Always deployed |
| **Localhost**        | ✅ Ready | Default set     | Always deployed |

## 📦 What Gets Deployed

Every deployment includes:

### 🪙 Mock Tokens

- **MockUSDC** - 6 decimals, with faucet (10,000 USDC max)
- **MockWBTC** - 8 decimals, with faucet (1 WBTC max)
- **MockWETH** - 18 decimals, with faucet (10 WETH max)

### 🏦 MultiTokenVault

- **ERC4626-compliant vault** with USDC as base asset
- **Pyth oracle integration** for real-time price feeds
- **Role-based access control** (Manager/Agent)
- **Multi-token deposit support** with automatic conversion

## 🔧 Network Configuration

### Pre-configured Networks

These networks are ready to use with default Pyth addresses:

```bash
# Ethereum
ETHEREUM_PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c69C6

# Arbitrum
ARBITRUM_PYTH_ADDRESS=0xff1a0f4744e8582DF1aE09D5611b887B6a12925C

# Base
BASE_PYTH_ADDRESS=0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a
```

### Flow Networks (Requires Configuration)

Set these in your `.env` file:

```bash
FLOW_PYTH_ADDRESS=your_flow_pyth_address
FLOW_TESTNET_PYTH_ADDRESS=your_flow_testnet_pyth_address
```

## ✅ Example Deployment Output

```
================================================================================
🚀 DEPLOYING TO: FLOW
================================================================================
📍 Deployer: 0x1234567890123456789012345678901234567890
💰 Balance: 50.5 FLOW
✅ Network configuration found for: flow
🔮 Pyth Oracle: 0x999...

📝 Deploying fresh mock tokens for this deployment...

=== Deploying Mock Tokens ===
🪙 Deploying Mock USDC...
✅ Mock USDC deployed: 0xabc123...
🪙 Deploying Mock WBTC...
✅ Mock WBTC deployed: 0xdef456...
🪙 Deploying Mock WETH...
✅ Mock WETH deployed: 0x789xyz...

=== Token Summary ===
🟡 USDC: 0xabc123... (6 decimals)
🟠 WBTC: 0xdef456... (8 decimals)
🔵 WETH: 0x789xyz... (18 decimals)

=== Deploying MultiTokenVault ===
👨‍💼 Manager: 0x1234...
🤖 Agent: 0x1234...
🏷️  Name: Multi-Token Vault
🏷️  Symbol: mtvUSDC
✅ MultiTokenVault deployed: 0x456def...

=== Configuring Accepted Tokens ===
⚙️  Configuring USDC...
✅ USDC configured (1:1, no oracle needed)
⚙️  Configuring WBTC...
✅ WBTC configured with BTC/USD price feed
⚙️  Configuring WETH...
✅ WETH configured with ETH/USD price feed

================================================================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY
================================================================================

📋 Contract Addresses:
🏦 MultiTokenVault: 0x456def...
🟡 Mock USDC: 0xabc123...
🟠 Mock WBTC: 0xdef456...
🔵 Mock WETH: 0x789xyz...

📝 Environment Variables (copy to .env file):
# ==================================================
FLOW_VAULT_ADDRESS=0x456def...
FLOW_USDC_ADDRESS=0xabc123...
FLOW_WBTC_ADDRESS=0xdef456...
FLOW_WETH_ADDRESS=0x789xyz...
# ==================================================

🚀 Deployment completed! Ready to use MultiTokenVault on flow
```

## 🧪 Testing Features

All deployed mock tokens include faucet functions for testing:

```solidity
// Get test tokens (anyone can call)
usdc.faucet(10000 * 10**6);  // Get 10,000 USDC
wbtc.faucet(1 * 10**8);      // Get 1 WBTC
weth.faucet(10 * 10**18);    // Get 10 WETH
```

## 🎯 Usage Examples

After deployment, interact with the vault:

```solidity
// Direct USDC deposit (1:1 conversion)
vault.deposit(1000 * 10**6, receiver);

// Multi-token deposits (with Pyth price conversion)
vault.depositToken(wbtcAddress, 1 * 10**8, receiver);    // Deposit 1 WBTC
vault.depositToken(wethAddress, 10 * 10**18, receiver);  // Deposit 10 WETH

// Withdrawals (always in USDC)
vault.withdraw(1000 * 10**6, receiver, owner);
```

## ➕ Adding New Blockchains

To add support for a new blockchain:

### 1. Update Hardhat Config

Add the network to `hardhat.config.ts`:

```typescript
networks: {
  // ... existing networks
  newChain: {
    url: process.env.NEW_CHAIN_RPC_URL || 'https://rpc.newchain.com',
    accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
  },
}
```

### 2. Update Environment Variables

Add to `env.example`:

```bash
# New Chain
NEW_CHAIN_RPC_URL=https://rpc.newchain.com
NEW_CHAIN_PYTH_ADDRESS=pyth_address_on_new_chain
```

### 3. Update Network Configuration

Add to `NETWORK_CONFIG` in `deployTokensAndVault.ts`:

```typescript
const NETWORK_CONFIG = {
  // ... existing configs
  newChain: {
    pyth: process.env.NEW_CHAIN_PYTH_ADDRESS,
  },
};
```

### 4. Deploy

```bash
npx hardhat run scripts/deployTokensAndVault.ts --network newChain
```

## 🔍 Contract Verification

For networks with block explorer support:

```bash
# Ethereum and testnets
npx hardhat verify --network ethereum <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Check specific blockchain documentation for verification commands
```

## 🚨 Troubleshooting

### Common Issues

| Error                            | Solution                                            |
| -------------------------------- | --------------------------------------------------- |
| `❌ Pyth address not configured` | Set the Pyth address for your network in `.env`     |
| `❌ Network 'X' not supported`   | Add network configuration following the guide above |
| `❌ Insufficient balance`        | Ensure you have native tokens for gas fees          |
| `❌ Invalid private key`         | Check your `PRIV_KEY` format in `.env`              |

### Network-Specific Notes

- **Flow**: Ensure you have FLOW tokens for gas
- **Ethereum**: High gas fees - consider using testnets for development
- **Arbitrum**: Lower gas fees, good for testing
- **Base**: Optimistic rollup with reasonable fees

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mock Tokens   │    │ MultiTokenVault  │    │  Pyth Oracle    │
│                 │    │                  │    │                 │
│ • MockUSDC      │────│ • ERC4626 Vault  │────│ • Price Feeds   │
│ • MockWBTC      │    │ • Role Control   │    │ • BTC/USD       │
│ • MockWETH      │    │ • Multi-token    │    │ • ETH/USD       │
│ • Faucets       │    │ • Strategies     │    │ • USDC/USD      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 Key Features

- ✅ **One-command deployment** across all networks
- ✅ **Consistent mock tokens** for testing and development
- ✅ **Automatic Pyth integration** with price feeds
- ✅ **Built-in faucets** for easy testing
- ✅ **Scalable architecture** for adding new blockchains
- ✅ **Clean output** with copy-paste ready addresses
- ✅ **Role-based access control** for secure management
- ✅ **ERC4626 compliance** for standard vault interactions

Ready to deploy on any Pyth-supported blockchain! 🚀
