# 🤖 SPQRFi

> **Advanced DeFi vault system with AI-driven strategy execution and multi-chain support**

## 📋 Overview

SPQRFi is a sophisticated DeFi protocol that combines traditional ERC4626 vault functionality with AI-driven strategy execution. The system allows users to deposit assets into vaults while AI agents automatically optimize yield through whitelisted strategies including swaps, lending, and other DeFi protocols.

### 🔒 Security First

- **Funds never leave the protocol**: AI agents can only execute pre-approved strategies within the smart contract ecosystem
- **Whitelisted strategies only**: Only admin/manager approved strategies can be executed
- **Role-based access control**: Clear separation between users, managers, and agents
- **Non-custodial**: Users maintain full ownership of their assets

## 🏗️ Architecture

### Core Components

#### 1. **Simple Vault** (`Vault.sol`)

- Standard ERC4626 vault for single-asset deposits (USDC)
- Role-based access control (Manager, Agent)
- Strategy execution capabilities
- Perfect for straightforward yield farming

#### 2. **Multi-Token Vault** (`MultiTokenVault.sol`)

- Accepts multiple ERC20 tokens (USDC, WBTC, WETH)
- Pyth oracle integration for price feeds
- Automatic token conversion to USDC equivalent
- Advanced multi-asset management

#### 3. **Strategy System**

- Whitelisted strategy contracts
- AI agent execution through secure interfaces
- Harvest and emergency exit capabilities
- Transparent fund management

### 🌐 Supported Networks

| Network               | Chain ID | Status    | RPC                                    |
| --------------------- | -------- | --------- | -------------------------------------- |
| **Flow Mainnet**      | 545      | ✅ Active | `https://mainnet.evm.nodes.onflow.org` |
| **Flow Testnet**      | 545      | ✅ Active | `https://testnet.evm.nodes.onflow.org` |
| **Rootstock Mainnet** | 30       | ✅ Active | `https://public-node.rsk.co`           |
| **Rootstock Testnet** | 31       | ✅ Active | `https://public-node.testnet.rsk.co`   |

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your PRIV_KEY to .env file
```

### 1. Deploy Simple Vault (Single Asset)

#### Flow Mainnet

```bash
# Deploy contracts
npm run deploy:simple:flow

# Get test tokens
npm run tokens:simple:flow

# Check status
npm run status:simple:flow

# Interact with vault
npm run interact:simple:flow
```

#### Flow Testnet

```bash
# Deploy contracts
npm run deploy:simple:flow-testnet

# Get test tokens
npm run tokens:simple:flow-testnet

# Check status
npm run status:simple:flow-testnet

# Interact with vault
npm run interact:simple:flow-testnet
```

#### Rootstock Mainnet

```bash
# Deploy contracts
npm run deploy:simple:rootstock

# Get test tokens
npm run tokens:simple:rootstock

# Check status
npm run status:simple:rootstock

# Interact with vault
npm run interact:simple:rootstock
```

#### Rootstock Testnet

```bash
# Deploy contracts
npm run deploy:simple:rootstock-testnet

# Get test tokens
npm run tokens:simple:rootstock-testnet

# Check status
npm run status:simple:rootstock-testnet

# Interact with vault
npm run interact:simple:rootstock-testnet
```

### 2. Deploy Multi-Token Vault (Multi Asset)

#### Flow Testnet

```bash
# Deploy complete system
npx hardhat run scripts/deploy-vault-system.ts --network flowTestnet

# Get test tokens
npx hardhat run scripts/get-test-tokens.ts --network flowTestnet

# Check status
npx hardhat run scripts/vault-status.ts --network flowTestnet

# Interact with vault
npx hardhat run scripts/interact-vault.ts --network flowTestnet
```

#### Flow Mainnet

```bash
# Deploy complete system
npx hardhat run scripts/deploy-vault-system.ts --network flow

# Get test tokens (if available)
npx hardhat run scripts/get-test-tokens.ts --network flow

# Check status
npx hardhat run scripts/vault-status.ts --network flow

# Interact with vault
npx hardhat run scripts/interact-vault.ts --network flow
```

## 📁 Project Structure

```
├── contracts/
│   ├── Vault.sol                    # Simple ERC4626 vault
│   ├── MultiTokenVault.sol          # Multi-token vault with oracles
│   ├── interfaces/
│   │   └── Strategies.sol           # Strategy interface
│   └── mocks/                       # Test tokens
├── scripts/
│   ├── deploy-simple-vault.ts       # Simple vault deployment
│   ├── deploy-vault-system.ts       # Multi-token system deployment
│   ├── interact-simple-vault.ts     # Simple vault interactions
│   ├── interact-vault.ts            # Multi-token vault interactions
│   ├── get-simple-vault-tokens.ts   # Get test tokens (simple)
│   ├── get-test-tokens.ts           # Get test tokens (multi)
│   ├── simple-vault-status.ts       # Simple vault status
│   └── vault-status.ts              # Multi-token vault status
├── deployments.json                 # Contract addresses registry
├── hardhat.config.ts               # Network configurations
└── package.json                    # NPM scripts
```

## 🔧 Available Commands

### Simple Vault Commands

| Command                                     | Description                           |
| ------------------------------------------- | ------------------------------------- |
| `npm run deploy:simple`                     | Deploy to localhost                   |
| `npm run deploy:simple:flow`                | Deploy to Flow mainnet                |
| `npm run deploy:simple:flow-testnet`        | Deploy to Flow testnet                |
| `npm run deploy:simple:rootstock`           | Deploy to Rootstock mainnet           |
| `npm run deploy:simple:rootstock-testnet`   | Deploy to Rootstock testnet           |
| `npm run tokens:simple:flow`                | Get test tokens on Flow mainnet       |
| `npm run tokens:simple:flow-testnet`        | Get test tokens on Flow testnet       |
| `npm run tokens:simple:rootstock`           | Get test tokens on Rootstock mainnet  |
| `npm run tokens:simple:rootstock-testnet`   | Get test tokens on Rootstock testnet  |
| `npm run status:simple:flow`                | Check Flow mainnet status             |
| `npm run status:simple:flow-testnet`        | Check Flow testnet status             |
| `npm run status:simple:rootstock`           | Check Rootstock mainnet status        |
| `npm run status:simple:rootstock-testnet`   | Check Rootstock testnet status        |
| `npm run interact:simple:flow`              | Interact with Flow mainnet vault      |
| `npm run interact:simple:flow-testnet`      | Interact with Flow testnet vault      |
| `npm run interact:simple:rootstock`         | Interact with Rootstock mainnet vault |
| `npm run interact:simple:rootstock-testnet` | Interact with Rootstock testnet vault |

### Multi-Token Vault Commands

```bash
# Deploy multi-token system
npx hardhat run scripts/deploy-vault-system.ts --network <network>

# Get test tokens
npx hardhat run scripts/get-test-tokens.ts --network <network>

# Check vault status
npx hardhat run scripts/vault-status.ts --network <network>

# Interact with vault
npx hardhat run scripts/interact-vault.ts --network <network>
```

## 💡 How It Works

### 1. **User Deposits**

Users deposit assets (USDC for simple vault, or USDC/WBTC/WETH for multi-token vault) and receive vault shares representing their ownership.

### 2. **AI Strategy Execution**

AI agents analyze market conditions and execute pre-approved strategies:

- **Lending protocols** (Aave, Compound)
- **DEX trading** (Uniswap, SushiSwap)
- **Yield farming** (Various DeFi protocols)
- **Arbitrage opportunities**

### 3. **Automated Yield Optimization**

The AI continuously monitors and rebalances positions to maximize returns while maintaining risk parameters.

### 4. **Secure Fund Management**

- Funds never leave the smart contract ecosystem
- All strategies are pre-approved by governance
- Emergency exit mechanisms available
- Transparent on-chain execution

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

### Oracle Integration

- Pyth Network price feeds for accurate valuations
- Stale price protection (25-minute maximum age)
- Multiple oracle sources for redundancy

## 📊 Deployment Status

### Current Deployments

#### Flow Testnet

- **MultiTokenVault**: `0x7C65F77a4EbEa3D56368A73A12234bB4384ACB28`
- **MockUSDC**: `0xAF28B48E48317109F885FEc05751f5422d850857`
- **MockWBTC**: `0x8fDE7A649c782c96e7f4D9D88490a7C5031F51a9`
- **MockWETH**: `0xF3B66dEF94Ab0C8D485e36845f068aFB48959A04`

#### Rootstock Testnet

- **Simple Vault**: `0x8fDE7A649c782c96e7f4D9D88490a7C5031F51a9`
- **MockUSDC**: `0xAF28B48E48317109F885FEc05751f5422d850857`

## 🎯 Usage Examples

### Simple Vault Interaction

```typescript
// Deploy and interact with simple vault
npm run deploy:simple:rootstock-testnet
npm run tokens:simple:rootstock-testnet
npm run interact:simple:rootstock-testnet

// Expected flow:
// 1. Deposit 1,000 USDC → Receive vault shares
// 2. AI executes strategies to generate yield
// 3. Withdraw 300 USDC → Burn corresponding shares
// 4. Remaining 700 USDC continues earning yield
```

### Multi-Token Vault Interaction

```typescript
// Deploy multi-token system
npx hardhat run scripts/deploy-vault-system.ts --network flowTestnet

// Get test tokens
npx hardhat run scripts/get-test-tokens.ts --network flowTestnet

// Interact with vault
npx hardhat run scripts/interact-vault.ts --network flowTestnet

// Expected flow:
// 1. Deposit WBTC → Converted to USDC equivalent via Pyth oracle
// 2. Deposit WETH → Converted to USDC equivalent via Pyth oracle
// 3. AI optimizes the combined USDC pool across strategies
// 4. Users can withdraw in USDC equivalent
```

## 🔍 Monitoring & Analytics

### Vault Status Checking

```bash
# Simple vault status
npm run status:simple:rootstock-testnet

# Multi-token vault status
npx hardhat run scripts/vault-status.ts --network flowTestnet
```

### Key Metrics Displayed

- **Total Assets**: Total value locked in vault
- **Total Supply**: Outstanding vault shares
- **Share Price**: Current value per share
- **User Balances**: Individual holdings
- **Strategy Performance**: Active strategy returns
- **Oracle Status**: Price feed health

## 🚨 Troubleshooting

### Common Issues

#### Oracle Price Stale

```
❌ WBTC Oracle: ❌ (Likely stale price data)
```

**Solution**: This is normal on testnets. Use USDC deposits which don't require oracles.

#### Insufficient Balance

```
❌ Insufficient USDC balance. You have 0.0 USDC
```

**Solution**: Run the token faucet script first:

```bash
npm run tokens:simple:rootstock-testnet
```

#### Network Configuration Error

```
❌ Network not configured in deployments.json
```

**Solution**: Deploy contracts first:

```bash
npm run deploy:simple:rootstock-testnet
```

### Debug Commands

```bash
# Check all contract statuses
npm run status:simple:rootstock-testnet

# Get more test tokens
npm run tokens:simple:rootstock-testnet

# Verify deployment on Flow
npx hardhat run scripts/vault-status.ts --network flowTestnet
```

## 🛠️ Development

### Local Development

```bash
# Start local node
npx hardhat node

# Deploy to localhost
npm run deploy:simple

# Interact locally
npm run interact:simple
```

### Testing

```bash
# Run tests
npx hardhat test

# Run specific test
npx hardhat test test/Vault.test.ts
```

### Adding New Networks

1. Add network configuration to `hardhat.config.ts`
2. Add chain configuration to `deployments.json`
3. Deploy using existing scripts
4. Update this README with new addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Documentation**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Twitter**: [Coming Soon]
- **Audit Reports**: [Coming Soon]

---

## 🎉 Success Indicators

After deployment, you should see:

- ✅ All contracts deployed and verified
- ✅ Test tokens available in your wallet
- ✅ Ability to deposit and withdraw from vaults
- ✅ AI strategies executing successfully
- ✅ Yield generation visible in vault metrics

**Ready to revolutionize DeFi with AI-powered yield optimization!** 🚀
