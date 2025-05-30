# 🏦 MultiTokenVault

A sophisticated ERC4626-compliant vault that accepts multiple tokens (USDC, WBTC, WETH) and uses Pyth Network oracles for real-time price conversion. All deposits are converted to USDC equivalents for unified vault management.

## ✨ Features

- **🪙 Multi-Token Support**: Accept USDC, WBTC, WETH deposits
- **🔮 Pyth Oracle Integration**: Real-time price feeds for accurate conversions
- **🏦 ERC4626 Compliant**: Standard vault interface for maximum compatibility
- **🔐 Role-Based Access Control**: Manager/Agent roles for secure operations
- **⚡ Strategy Integration**: Execute yield-generating strategies
- **🧪 Testing Ready**: Built-in mock tokens with faucet functions
- **🌐 Multi-Chain**: Deploy on any Pyth-supported blockchain

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Tokens   │    │ MultiTokenVault  │    │  Pyth Oracle    │
│                 │    │                  │    │                 │
│ • USDC (1:1)    │────│ • ERC4626 Vault  │────│ • Price Feeds   │
│ • WBTC (oracle) │    │ • Role Control   │    │ • BTC/USD       │
│ • WETH (oracle) │    │ • Multi-token    │    │ • ETH/USD       │
│                 │    │ • Strategies     │    │ • USDC/USD      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Hardhat development environment
- Private key with gas tokens
- Pyth Network oracle address for your blockchain

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd multitokenvault

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your configuration
```

### Deploy

```bash
# Deploy to any supported network
npx hardhat run scripts/deployTokensAndVault.ts --network <NETWORK>

# Examples:
npx hardhat run scripts/deployTokensAndVault.ts --network flow
npx hardhat run scripts/deployTokensAndVault.ts --network ethereum
npx hardhat run scripts/deployTokensAndVault.ts --network arbitrum
```

## 💰 How It Works

### Deposit Process

1. **USDC Deposits**: Direct 1:1 conversion to vault shares
2. **WBTC/WETH Deposits**: Pyth oracle converts to USDC equivalent
3. **Share Minting**: ERC4626 shares minted based on USDC value
4. **Yield Generation**: Deposits used in strategies for yield

### Price Conversion Example

```solidity
// User deposits 1 WBTC when BTC = $45,000
// Vault converts: 1 WBTC → 45,000 USDC equivalent
// Shares minted based on 45,000 USDC value
vault.depositToken(wbtcAddress, 1e8, userAddress);
```

## 📋 Supported Networks

| Network  | Status | Pyth Oracle    | Mock Tokens     |
| -------- | ------ | -------------- | --------------- |
| Ethereum | ✅     | Pre-configured | Always deployed |
| Arbitrum | ✅     | Pre-configured | Always deployed |
| Base     | ✅     | Pre-configured | Always deployed |
| Flow     | ✅     | Manual config  | Always deployed |
| Testnets | ✅     | Pre-configured | Always deployed |

## 🎯 Usage Examples

### Basic Deposits

```solidity
// USDC deposit (1:1)
vault.deposit(1000 * 1e6, receiver);

// WBTC deposit (with oracle)
vault.depositToken(wbtcAddress, 1 * 1e8, receiver);

// WETH deposit (with oracle)
vault.depositToken(wethAddress, 10 * 1e18, receiver);
```

### Withdrawals

```solidity
// Always withdraw USDC (base asset)
vault.withdraw(1000 * 1e6, receiver, owner);
vault.redeem(shares, receiver, owner);
```

### Testing with Mock Tokens

```solidity
// Get test tokens from faucets
MockUSDC(usdcAddress).faucet(10000 * 1e6);   // 10k USDC
MockWBTC(wbtcAddress).faucet(1 * 1e8);       // 1 WBTC
MockWETH(wethAddress).faucet(10 * 1e18);     // 10 WETH
```

### Strategy Management (Manager Role)

```solidity
// Add strategy
vault.addStrategy(strategyAddress);

// Configure new tokens
vault.configureToken(tokenAddress, pythPriceId, decimals);
```

### Strategy Execution (Agent Role)

```solidity
// Execute strategy
vault.executeStrategy(strategyAddress, data);

// Deposit to strategy
vault.depositToStrategy(strategyAddress, amount, data);

// Harvest rewards
vault.harvestStrategy(strategyAddress, data);
```

## 🔧 Configuration

### Environment Variables

Key variables for deployment:

```bash
# Required
PRIV_KEY=your_private_key

# Network-specific Pyth addresses
ETHEREUM_PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c69C6
ARBITRUM_PYTH_ADDRESS=0xff1a0f4744e8582DF1aE09D5611b887B6a12925C
BASE_PYTH_ADDRESS=0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a
FLOW_PYTH_ADDRESS=your_flow_pyth_address

# Optional
VAULT_NAME=Multi-Token Vault
VAULT_SYMBOL=mtvUSDC
MANAGER_ADDRESS=manager_address
AGENT_ADDRESS=agent_address
```

### Pyth Price IDs

Universal price feed identifiers:

```bash
BTC_USD_PRICE_ID=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
ETH_USD_PRICE_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
USDC_USD_PRICE_ID=0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/MultiTokenVault.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage

The test suite covers:

- ✅ Multi-token deposits and withdrawals
- ✅ Pyth oracle price conversions
- ✅ Role-based access control
- ✅ Strategy management
- ✅ Error handling and edge cases
- ✅ ERC4626 compliance

## 📁 Project Structure

```
├── contracts/
│   ├── MultiTokenVault.sol      # Main vault contract
│   ├── Vault.sol               # Base vault implementation
│   ├── interfaces/
│   │   └── Strategies.sol      # Strategy interface
│   └── mocks/
│       ├── MockUSDC.sol        # Mock USDC with faucet
│       ├── MockWBTC.sol        # Mock WBTC with faucet
│       └── MockWETH.sol        # Mock WETH with faucet
├── scripts/
│   ├── deployTokensAndVault.ts # Main deployment script
│   └── deployMultiTokenVault.ts # Legacy deployment
├── test/
│   └── MultiTokenVault.test.ts # Comprehensive test suite
├── README_DEPLOYMENT.md        # Detailed deployment guide
└── README.md                   # This file
```

## 🔐 Security Features

### Access Control

- **Owner**: Full contract control and upgrades
- **Manager**: Token configuration and strategy management
- **Agent**: Strategy execution and operations

### Price Security

- **Pyth Integration**: Decentralized, high-frequency price feeds
- **Price Staleness Check**: Configurable maximum age (25 minutes)
- **Price Validation**: Positive price enforcement

### Vault Security

- **Reentrancy Protection**: All external calls protected
- **ERC4626 Compliance**: Standard security patterns
- **Role Separation**: Clear separation of powers

## 🛠️ Development

### Adding New Tokens

```solidity
// Manager can add new supported tokens
vault.configureToken(
    tokenAddress,       // ERC20 token address
    pythPriceId,       // Pyth price feed ID
    decimals           // Token decimals
);
```

### Adding New Networks

1. Add network to `hardhat.config.ts`
2. Add Pyth oracle address to `env.example`
3. Update `NETWORK_CONFIG` in deployment script
4. Deploy and test

### Custom Strategies

Implement the `IStrategies` interface:

```solidity
interface IStrategies {
    function execute(uint256 amount, bytes calldata data) external;
    function harvest(bytes calldata data) external;
    function emergencyExit(bytes calldata data) external;
}
```

## 📊 Gas Optimization

The contract is optimized for gas efficiency:

- **Packed Structs**: Minimize storage slots
- **Batch Operations**: Single transaction for multiple operations
- **Efficient Calculations**: Optimized price conversion math
- **Minimal External Calls**: Reduce gas costs

## 🐛 Troubleshooting

### Common Issues

| Issue                | Solution                                  |
| -------------------- | ----------------------------------------- |
| Pyth address not set | Configure `*_PYTH_ADDRESS` in `.env`      |
| Token not accepted   | Call `configureToken()` with Manager role |
| Price too old        | Check Pyth oracle is updating prices      |
| Insufficient balance | Ensure enough tokens for deposit          |

### Debug Mode

```bash
# Enable debug logging
DEBUG=true npx hardhat run scripts/deployTokensAndVault.ts --network localhost
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📞 Support

- **Documentation**: See `README_DEPLOYMENT.md` for deployment details
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Ready to deploy multi-token yield vaults on any Pyth-supported blockchain!** 🚀
