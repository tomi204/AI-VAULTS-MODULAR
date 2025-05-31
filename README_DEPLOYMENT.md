# 🚀 MultiTokenVault Deployment Guide

> **Advanced deployment system with automatic configuration and multi-chain support**

## 📋 Overview

This deployment system automatically manages contract addresses, configurations, and provides easy testing capabilities across multiple blockchains. Everything is stored in `deployments.json` for easy tracking and reuse.

## 🏗️ Architecture

### Supported Networks

- **Ethereum**: Mainnet, Sepolia
- **Arbitrum**: Mainnet, Sepolia
- **Base**: Mainnet, Sepolia
- **Flow**: Mainnet, Testnet ✨

### Components

- **MockUSDC**: 6 decimals, 10,000 USDC faucet
- **MockWBTC**: 8 decimals, 1 WBTC faucet
- **MockWETH**: 18 decimals, 10 WETH faucet
- **MultiTokenVault**: ERC4626 vault with multi-token support and Pyth oracles

## 🔧 Quick Start

### 1. Configure Environment

```bash
# Copy and configure environment
cp .env.example .env
# Add your PRIV_KEY and RPC URLs
```

### 2. Deploy on Any Network

```bash
# Deploy complete system (tokens + vault + configuration)
npx hardhat run scripts/deploy-vault-system.ts --network <network>

# Examples:
npx hardhat run scripts/deploy-vault-system.ts --network flowTestnet
npx hardhat run scripts/deploy-vault-system.ts --network base
npx hardhat run scripts/deploy-vault-system.ts --network sepolia
```

### 3. Get Test Tokens

```bash
# Get tokens for testing
npx hardhat run scripts/get-test-tokens.ts --network <network>
```

### 4. Test the Vault

```bash
# Interact with the vault
npx hardhat run scripts/interact-vault.ts --network <network>

# Check vault status
npx hardhat run scripts/vault-status.ts --network <network>
```

## 📁 File Structure

```
├── deployments.json           # 🗃️ Central deployment registry
├── scripts/
│   ├── deploy-vault-system.ts # 🚀 Main deployment script
│   ├── vault-status.ts        # 📊 Status checker
│   ├── get-test-tokens.ts     # 🚿 Token faucet
│   └── interact-vault.ts      # 🎮 Interaction script
└── hardhat.config.ts          # ⚙️ Network configurations
```

## 🗃️ Deployments.json Structure

```json
{
  "chains": {
    "networkName": {
      "chainId": 545,
      "pyth": "0x...", // Pyth contract address
      "tokens": {
        "MockUSDC": "0x...",
        "MockWBTC": "0x...",
        "MockWETH": "0x..."
      },
      "vaults": {
        "MultiTokenVault": "0x..."
      }
    }
  },
  "priceIds": {
    // Universal Pyth price IDs
    "BTC_USD": "0x...",
    "ETH_USD": "0x...",
    "USDC_USD": "0x..."
  },
  "tokenConfig": {
    // Token specifications
    "MockUSDC": {
      "decimals": 6,
      "priceId": "USDC_USD",
      "faucetAmount": "10000"
    }
  }
}
```

## 🔮 Pyth Network Addresses

The system automatically uses the correct Pyth contract for each network:

| Network                   | Pyth Contract Address                        |
| ------------------------- | -------------------------------------------- |
| Ethereum/Sepolia          | `0x4305FB66699C3B2702D4d05CF36551390A4c69C6` |
| Arbitrum/Arbitrum Sepolia | `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C` |
| Base/Base Sepolia         | `0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a` |
| Flow/Flow Testnet         | `0x2880aB155794e7179c9eE2e38200202908C17B43` |

## 🎯 Deployment Features

### ✅ Smart Deployment

- **Idempotent**: Re-running won't redeploy existing contracts
- **Auto-configuration**: Tokens automatically configured in vault
- **Token minting**: Test tokens automatically minted to deployer
- **Validation**: Comprehensive deployment verification

### ⚙️ Auto-Configuration

```typescript
// Automatically configures:
// - USDC with 1:1 conversion (no oracle)
// - WBTC with BTC/USD Pyth price feed
// - WETH with ETH/USD Pyth price feed
```

### 🚿 Test Token Faucets

- **MockUSDC**: 10,000 USDC per faucet call
- **MockWBTC**: 1 WBTC per faucet call
- **MockWETH**: 10 WETH per faucet call

## 🧪 Testing Workflow

### Full Testing Sequence

```bash
# 1. Deploy everything
npx hardhat run scripts/deploy-vault-system.ts --network flowTestnet

# 2. Check deployment status
npx hardhat run scripts/vault-status.ts --network flowTestnet

# 3. Get test tokens
npx hardhat run scripts/get-test-tokens.ts --network flowTestnet

# 4. Interact with vault
npx hardhat run scripts/interact-vault.ts --network flowTestnet
```

### Expected Output

```
🚀 Deploying Vault System on flowTestnet
==================================================
✅ MockUSDC: 0x... (already deployed)
✅ MockWBTC: 0x... (already deployed)
✅ MockWETH: 0x... (already deployed)
✅ MultiTokenVault: 0x... (already deployed)
⚙️  Configuring Tokens in Vault...
✅ MockUSDC already configured
✅ MockWBTC already configured
✅ MockWETH already configured
💰 Minting Test Tokens to Deployer...
✅ USDC balance sufficient: 999996000.0
✅ WBTC balance sufficient: 21000000.0
✅ WETH balance sufficient: 120000000.0
```

## 🌐 Multi-Chain Deployment

### Deploy to Multiple Networks

```bash
# Deploy to Base mainnet
npx hardhat run scripts/deploy-vault-system.ts --network base

# Deploy to Arbitrum
npx hardhat run scripts/deploy-vault-system.ts --network arbitrum

# Deploy to Ethereum Sepolia
npx hardhat run scripts/deploy-vault-system.ts --network sepolia
```

### Network-Specific Considerations

#### 🌊 **Flow Network**

- **Oracle Status**: Pyth data may be stale on testnet (>25 min)
- **USDC deposits**: Always work (1:1 conversion)
- **WBTC/WETH deposits**: May fail due to stale oracle data

#### 🔵 **Base Network**

- **Oracle Status**: Active and well-maintained
- **All tokens**: Should work correctly
- **Gas**: Very low transaction costs

#### 🔴 **Arbitrum Network**

- **Oracle Status**: Active and reliable
- **All tokens**: Full functionality expected
- **Gas**: Low transaction costs

## 🔍 Troubleshooting

### Common Issues

#### Oracle Failures

```
❌ WBTC Oracle: ❌ (Likely stale price data)
```

**Solution**: This is normal on testnets. Use USDC deposits which don't require oracles.

#### Network Not Configured

```
❌ Network mynetwork not configured in deployments.json
Available networks: localhost, sepolia, base, flowTestnet
```

**Solution**: Add your network to `deployments.json` with proper Pyth address.

#### Insufficient Balance

```
❌ Failed to get MockUSDC: execution reverted
```

**Solution**: Check you have enough native tokens for gas fees.

### Debug Commands

```bash
# Check all contract statuses
npx hardhat run scripts/vault-status.ts --network <network>

# Check token configurations
npx hardhat run scripts/check-token-config.ts --network <network>

# Get more test tokens
npx hardhat run scripts/get-test-tokens.ts --network <network>
```

## 📊 Monitoring

### Vault Status Check

```bash
npx hardhat run scripts/vault-status.ts --network <network>
```

**Shows:**

- ✅ Deployment status of all contracts
- 💰 Your token balances
- ⚙️ Token configurations in vault
- 🔮 Oracle functionality status
- 🎯 Next steps recommendations

### Example Status Output

```
📊 Vault Status Check on flowTestnet
=======================================
✅ MockUSDC: 0x... (USDC, 6 decimals)
✅ MultiTokenVault: 0x...
   Total Assets: 4000.0 USDC
   Total Supply: 4000.0 mtvUSDC

💰 Account Balances:
  • USDC: 999996000.0
  • mtvUSDC: 4000.0

🔮 Oracle Status:
  • USDC Oracle: ✅ (1000 USDC → 1000.0 USDC)
  • WBTC Oracle: ❌ (Likely stale price data)
```

## 🔐 Security Notes

1. **Private Keys**: Keep your `PRIV_KEY` secure and never commit it
2. **Testnet Only**: These are mock tokens for testing purposes
3. **Oracle Dependency**: Real deployments should monitor oracle health
4. **Role Management**: Deployer gets Manager and Agent roles by default

## 🚀 Production Deployment

For production deployment:

1. **Use Real Tokens**: Replace mock tokens with actual token addresses
2. **Oracle Monitoring**: Implement oracle health checks
3. **Multi-sig**: Use multi-signature wallets for critical roles
4. **Gradual Rollout**: Start with small amounts and scale up
5. **Monitoring**: Set up comprehensive monitoring and alerting

## 📝 Next Steps

1. **Test on Flow Testnet**: Full functionality demonstration
2. **Deploy on Base**: Production-ready environment testing
3. **Add More Networks**: Expand to other EVM chains
4. **Enhanced Features**: Add more tokens and strategies
5. **Production**: Deploy with real tokens and proper security

---

## 🎉 Quick Success Check

After running the deployment, you should see:

- ✅ All contracts deployed and verified
- ✅ Tokens configured in vault with correct price feeds
- ✅ Test tokens in your wallet
- ✅ Ability to deposit USDC (1:1 ratio)
- ⚠️ WBTC/WETH may fail on testnets due to stale oracle data

**Everything working?** 🎉 Your MultiTokenVault system is ready!
