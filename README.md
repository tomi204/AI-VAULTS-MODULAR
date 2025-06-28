# 🏔️ AI-VAULTS

> **Advanced DeFi vault system with AI-driven strategy execution on Avalanche**

## 📋 Overview

AI-VAULTS is a sophisticated DeFi protocol built on Avalanche that combines traditional ERC4626 vault functionality with AI-driven strategy execution. The system allows users to deposit multiple ERC20 tokens into vaults while AI agents automatically optimize yield through whitelisted strategies including swaps, lending, and other DeFi protocols.

### 🔒 Security First

- **Funds never leave the protocol**: AI agents can only execute pre-approved strategies within the smart contract ecosystem
- **Whitelisted strategies only**: Only admin/manager approved strategies can be executed
- **Role-based access control**: Clear separation between users, managers, and agents
- **Non-custodial**: Users maintain full ownership of their assets

## 🏗️ Architecture

### Core Components

#### **Multi-Token Vault** (`MultiTokenVault.sol`)

- Accepts multiple ERC20 tokens (USDC, WBTC, WETH, LINK)
- Chainlink oracle integration for reliable price feeds
- Automatic token conversion to USDC equivalent
- Advanced multi-asset management with precise pricing

#### **Strategy System**

- Whitelisted strategy contracts
- AI agent execution through secure interfaces
- Harvest and emergency exit capabilities
- Transparent fund management

#### **Chainlink Price Feeds**

- Real-time, reliable price data for all supported tokens
- Staleness protection to ensure data freshness
- Multiple validation checks for price accuracy
- 24-hour staleness tolerance for testnets, 25 minutes for mainnet

### 🌐 Supported Networks

| Network               | Chain ID | Status    | RPC                                          |
| --------------------- | -------- | --------- | -------------------------------------------- |
| **Avalanche Mainnet** | 43114    | ✅ Active | `https://api.avax.network/ext/bc/C/rpc`      |
| **Avalanche Fuji**    | 43113    | ✅ Active | `https://api.avax-test.network/ext/bc/C/rpc` |

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your PRIV_KEY and Chainlink price feed addresses
```

### Deploy Multi-Token Vault System

#### Avalanche Fuji Testnet (Recommended for Testing)

```bash
# Deploy complete system with test tokens
npm run deploy:fuji

# Get test tokens from faucets
npm run tokens

# Mint additional test tokens if needed
npm run mint

# Check vault status
npm run status

# Interact with vault (deposit/withdraw)
npm run interact
```

#### Avalanche Mainnet (Production)

```bash
# Deploy to mainnet (requires real AVAX for gas)
npm run deploy:avalanche

# Check vault status
npm run status

# Interact with vault
npm run interact
```

### Supported Tokens

| Token           | Symbol | Decimals | Chainlink Feed |
| --------------- | ------ | -------- | -------------- |
| USD Coin        | USDC   | 6        | USDC/USD       |
| Wrapped Bitcoin | WBTC   | 8        | BTC/USD        |
| Wrapped Ether   | WETH   | 18       | ETH/USD        |
| Chainlink Token | LINK   | 18       | LINK/USD       |

## 📁 Project Structure

```
├── contracts/
│   ├── MultiTokenVault.sol          # Multi-token vault with Chainlink oracles
│   ├── interfaces/
│   │   ├── IMultiTokenVault.sol     # Vault interface
│   │   └── Strategies.sol           # Strategy interface
│   └── mocks/                       # Test tokens (USDC, WBTC, WETH)
├── scripts/
│   ├── deployTokensAndVault.ts      # Main deployment script
│   ├── interact-vault.ts            # Vault interaction script
│   ├── get-test-tokens.ts           # Token faucet script
│   ├── mint-tokens.ts               # Mint additional test tokens
│   └── vault-status.ts              # Vault status checker
├── ignition/
│   └── modules/
│       └── MultiTokenVaultSystem.ts # Hardhat Ignition deployment
├── .env.example                     # Environment variables template
├── hardhat.config.ts               # Avalanche network configurations
└── package.json                    # NPM scripts
```

## 🔧 Available Commands

### Deployment Commands

| Command                    | Description                      |
| -------------------------- | -------------------------------- |
| `npm run deploy`           | Deploy to localhost              |
| `npm run deploy:fuji`      | Deploy to Avalanche Fuji testnet |
| `npm run deploy:avalanche` | Deploy to Avalanche mainnet      |

### Interaction Commands

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `npm run tokens`   | Get test tokens from faucets |
| `npm run mint`     | Mint additional test tokens  |
| `npm run status`   | Check vault and token status |
| `npm run interact` | Interactive vault operations |

### Development Commands

| Command           | Description       |
| ----------------- | ----------------- |
| `npm test`        | Run all tests     |
| `npm run compile` | Compile contracts |
| `npm run clean`   | Clean artifacts   |

## 💡 How It Works

### 1. **Multi-Token Deposits**

Users can deposit any supported ERC20 token (USDC, WBTC, WETH, LINK) into the vault. The system automatically:

- **Fetches real-time prices** from Chainlink oracles
- **Converts token values** to USDC equivalent
- **Mints vault shares** proportional to the deposited value
- **Maintains accurate accounting** of all deposited assets

### 2. **Chainlink Price Oracles**

The vault uses Chainlink's decentralized oracle network for reliable price data:

- **Real-time pricing** for BTC/USD, ETH/USD, LINK/USD feeds
- **Staleness protection** ensures price data is fresh (24h tolerance on testnets)
- **Multiple validation checks** prevent invalid or manipulated data
- **High precision** with proper decimal handling for each token

### 3. **AI Strategy Execution**

AI agents analyze market conditions and execute pre-approved strategies:

- **Lending protocols** (Aave, Benqi on Avalanche)
- **DEX trading** (Trader Joe, Pangolin)
- **Yield farming** (Various Avalanche DeFi protocols)
- **Cross-chain opportunities** (Avalanche bridge strategies)

### 4. **Automated Yield Optimization**

The AI continuously monitors and rebalances positions to maximize returns while maintaining risk parameters optimized for Avalanche's fast and low-cost environment.

### 5. **Secure Fund Management**

- Funds never leave the smart contract ecosystem
- All strategies are pre-approved by governance
- Emergency exit mechanisms available
- Transparent on-chain execution on Avalanche

## 🔐 Security Features

### Role-Based Access Control

| Role        | Permissions                             |
| ----------- | --------------------------------------- |
| **User**    | Deposit, withdraw, redeem shares        |
| **Manager** | Add/remove strategies, configure tokens |
| **Agent**   | Execute strategies, harvest rewards     |
| **Admin**   | Grant/revoke roles, emergency functions |

### Strategy Whitelisting

- Only pre-approved strategies can be executed
- Strategies undergo security audits
- Community governance for strategy approval
- Emergency pause mechanisms

### Chainlink Oracle Integration

- **Decentralized price feeds** from Chainlink's proven oracle network
- **Staleness protection** with configurable maximum age limits
- **Data validation** prevents invalid or zero price data
- **High availability** with Avalanche's reliable infrastructure

## 📊 Deployment Status

### Current Deployments

#### Avalanche Fuji Testnet

- **MultiTokenVault**: `0xCf0830B6595904D85d36A4228841483737e80263`
- **MockUSDC**: `0xff861DC110F4F0b3bF0e1984c58dec2073B69D54`
- **MockWBTC**: `0xC1A288E35D27Ece799Dd37FEBDd2B6734C884058`
- **MockWETH**: `0x4b08Cc3Dd8c75965BE26A70721d1e6099404DCa8`

#### Chainlink Price Feeds (Fuji Testnet)

- **BTC/USD**: `0x31CF013A08c6Ac228C94551d535d5BAfE19c602a`
- **ETH/USD**: `0x86d67c3D38D2bCeE722E601025C25a575021c6EA`
- **LINK/USD**: `0x79c91fd4F8b3DaBEe17d286EB11cEE4D83521775`

## 🎯 Usage Examples

### Multi-Token Vault Interaction on Avalanche Fuji

```bash
# Deploy the complete system
npm run deploy:fuji

# Get test tokens from faucets
npm run tokens

# Mint additional tokens if needed
npm run mint

# Interact with the vault
npm run interact
```

### Expected Deposit Flow

```typescript
// 1. Deposit USDC (1:1 conversion, no oracle needed)
// Example: 1,000 USDC → 1,000 vault shares

// 2. Deposit WBTC → Converted via Chainlink BTC/USD feed
// Example: 0.01 WBTC (~$430 at $43,000/BTC) → ~430 vault shares

// 3. Deposit WETH → Converted via Chainlink ETH/USD feed
// Example: 0.1 WETH (~$242 at $2,420/ETH) → ~242 vault shares

// 4. Deposit LINK → Converted via Chainlink LINK/USD feed
// Example: 100 LINK (~$1,350 at $13.50/LINK) → ~1,350 vault shares

// 5. AI optimizes the combined USDC equivalent across Avalanche DeFi
// 6. Users can withdraw their proportional share anytime
```

### Real Deployment Example (Fuji Testnet)

```bash
# Current working deployment on Fuji:
# - USDC deposits: ✅ Working perfectly
# - WETH deposits: ✅ Working (Chainlink feeds active)
# - WBTC deposits: ⚠️  May have stale price feeds (testnet limitation)

# To test:
npm run status    # Check current vault state
npm run interact  # Deposit/withdraw tokens
```

## 🔍 Monitoring & Analytics

### Vault Status Checking

```bash
# Check vault and token status
npm run status

# This displays:
# - Total vault assets and shares
# - Individual token balances
# - Chainlink price feed status
# - Contract addresses and network info
```

### Key Metrics Displayed

- **Total Assets**: Total USDC equivalent locked in vault
- **Total Supply**: Outstanding vault shares
- **Share Price**: Current value per vault share
- **Token Balances**: USDC, WBTC, WETH, LINK holdings
- **Oracle Status**: Chainlink price feed health and staleness
- **Contract Info**: Deployed addresses on Avalanche

## 🚨 Troubleshooting

### Common Issues

#### Chainlink Price Feed Stale

```
❌ WBTC Price Feed: Stale (37 hours old)
✅ WETH Price Feed: Fresh (3 minutes old)
```

**Solution**: This is common on testnets where price feeds update less frequently. The contract allows 24-hour staleness on testnets. For production (mainnet), feeds update much more frequently.

#### Insufficient Token Balance

```
❌ Insufficient WBTC balance. You have 0.0 WBTC
```

**Solution**: Get test tokens from faucets:

```bash
npm run tokens  # Get initial tokens
npm run mint    # Mint additional tokens if needed
```

#### Deployment Not Found

```
❌ No deployment found for network fuji
```

**Solution**: Deploy the contracts first:

```bash
npm run deploy:fuji
```

### Debug Commands

```bash
# Full system status check
npm run status

# Get fresh test tokens
npm run tokens

# Mint more tokens (respects faucet limits)
npm run mint

# Interactive vault operations
npm run interact
```

### Testnet Limitations

- **Price Feed Staleness**: Fuji testnet feeds may be stale (normal behavior)
- **Faucet Limits**: Limited amounts per call (10,000 USDC, 1 WBTC, 10 WETH)
- **Gas Costs**: Use Avalanche Fuji faucet for test AVAX

## 🛠️ Development

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to localhost
npm run deploy

# Run tests
npm test

# Compile contracts
npm run compile
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/MultiTokenVault.test.ts

# Test with coverage
npx hardhat coverage
```

### Environment Setup

1. Copy environment template: `cp .env.example .env`
2. Add your private key: `PRIV_KEY=your_private_key_here`
3. Configure Chainlink price feeds for your target network
4. Deploy: `npm run deploy:fuji` or `npm run deploy:avalanche`

## 🏔️ Why Avalanche?

### Technical Advantages

- **Sub-second finality**: Fast transaction confirmation
- **Low costs**: Minimal gas fees for frequent operations
- **EVM compatibility**: Seamless smart contract deployment
- **High throughput**: Handles high transaction volumes efficiently

### DeFi Ecosystem

- **Mature protocols**: Aave, Benqi, Trader Joe, Pangolin
- **Chainlink integration**: Reliable price feeds available
- **Bridge infrastructure**: Easy asset transfers from other chains
- **Growing TVL**: Expanding DeFi opportunities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Success Indicators

After deployment to Avalanche Fuji, you should see:

- ✅ MultiTokenVault deployed and operational
- ✅ Test tokens (USDC, WBTC, WETH) available via faucets
- ✅ Chainlink price feeds providing real-time data
- ✅ Successful multi-token deposits with proper conversion
- ✅ Vault shares minted proportional to deposited value

**Ready to experience multi-token DeFi on Avalanche!** 🏔️
