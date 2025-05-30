# 🏛️ DeFi Vault & Strategies System

A comprehensive, production-ready DeFi vault system with generic strategy implementation for interacting with any protocol. Built with Hardhat, TypeScript, and OpenZeppelin contracts.

## 🌟 Features

- **ERC4626 Compliant Vault**: Standard vault implementation with role-based access control
- **Generic Strategy Pattern**: Reusable strategy contracts that work with any DeFi protocol
- **Role-Based Access Control**: Manager and Agent roles for secure operations
- **Emergency Exit Functionality**: Safe withdrawal mechanisms for risk management
- **Reward Harvesting**: Automatic collection and forwarding of protocol rewards
- **Comprehensive Testing**: 97 unit tests covering all functionality
- **CLI Tools**: Intuitive command-line interface for deployment and interaction
- **Hardhat Ignition**: Professional deployment system with modular architecture

## 📁 Project Structure

```
├── contracts/
│   ├── Vault.sol                 # Main ERC4626 vault contract
│   ├── strategies/
│   │   └── strategies.sol        # Generic strategy implementation
│   ├── interfaces/
│   │   ├── Vault.sol            # Vault interface
│   │   └── Strategies.sol       # Strategy interface
│   └── mocks/
│       ├── MockToken.sol        # ERC20 token for testing
│       └── MockProtocol.sol     # Mock DeFi protocol
├── test/
│   ├── Vault.test.ts           # Comprehensive vault tests
│   ├── Strategies.test.ts      # Strategy functionality tests
│   └── MockProtocol.test.ts    # Protocol interaction tests
├── scripts/
│   ├── cli.ts                  # Main CLI hub
│   ├── deploy.ts               # Deployment script
│   ├── interact.ts             # Interactive CLI
│   └── test-integration.ts     # Integration tests
├── ignition/
│   └── modules/                # Hardhat Ignition deployment modules
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Compile Contracts

```bash
npx hardhat run scripts/cli.ts compile
```

### 3. Run Tests

```bash
npx hardhat run scripts/cli.ts test
```

### 4. Deploy System

```bash
npx hardhat run scripts/cli.ts deploy
```

### 5. Interact with Contracts

```bash
npx hardhat run scripts/cli.ts interact status
```

## 🔧 CLI Commands

The system includes a comprehensive CLI for all operations:

### Main Commands

```bash
# Show help
npx hardhat run scripts/cli.ts help

# Compile contracts
npx hardhat run scripts/cli.ts compile

# Run unit tests
npx hardhat run scripts/cli.ts test

# Run integration tests
npx hardhat run scripts/cli.ts test-integration

# Deploy complete system
npx hardhat run scripts/cli.ts deploy

# Interactive contract operations
npx hardhat run scripts/cli.ts interact <action>
```

### Interactive Commands

```bash
# Check system status
npx hardhat run scripts/cli.ts interact status

# User deposits to vault
npx hardhat run scripts/cli.ts interact deposit

# User withdraws from vault
npx hardhat run scripts/cli.ts interact withdraw

# Agent deploys funds to strategy
npx hardhat run scripts/cli.ts interact deploy-to-strategy

# Agent harvests strategy rewards
npx hardhat run scripts/cli.ts interact harvest

# Agent performs emergency exit
npx hardhat run scripts/cli.ts interact emergency-exit
```

## 🏗️ Architecture

### Vault Contract

The `Vault.sol` contract implements:

- **ERC4626 Standard**: Full compliance with vault token standard
- **Role-Based Access**: Manager and Agent roles with specific permissions
- **Strategy Management**: Add, remove, and execute strategies
- **Asset Management**: Deposit, withdraw, mint, and redeem functions
- **Emergency Controls**: Emergency exit and pause functionality

### Strategy Contract

The `Strategies.sol` contract provides:

- **Generic Protocol Interface**: Works with any DeFi protocol via function selectors
- **Flexible Execution**: Custom data support for complex protocol interactions
- **Reward Management**: Automatic detection and forwarding of reward tokens
- **Safety Features**: Pause functionality and emergency exit
- **Gas Optimization**: Efficient operations with configurable limits

### Key Features

#### Role-Based Access Control

```solidity
// Manager Role - Can add/remove strategies
bytes32 public constant MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");

// Agent Role - Can execute strategies and harvest
bytes32 public constant AGENT_ROLE = keccak256("VAULT_ADMIN_ROLE");
```

#### Generic Strategy Pattern

```solidity
// Strategy works with any protocol via function selectors
constructor(
    address _underlyingToken,
    address _protocol,
    bytes4 _depositSelector,
    bytes4 _withdrawSelector,
    bytes4 _claimSelector,
    bytes4 _getBalanceSelector
)
```

#### Emergency Exit

```solidity
// Safe withdrawal of all funds from protocol
function emergencyExit(bytes calldata data) external onlyAgent nonReentrant
```

## 🧪 Testing

The system includes comprehensive testing with **97 passing tests**:

### Test Categories

1. **Unit Tests** (97 tests)

   - Vault functionality (ERC4626 compliance)
   - Strategy operations (execute, harvest, emergency exit)
   - Access control and security
   - Edge cases and error handling
   - Gas optimization

2. **Integration Tests**
   - End-to-end user flows
   - Multi-strategy scenarios
   - Real protocol interactions
   - Performance benchmarks

### Running Tests

```bash
# All unit tests
npx hardhat test

# Specific test file
npx hardhat test test/Vault.test.ts

# Integration tests
npx hardhat run scripts/test-integration.ts

# Test with gas reporting
REPORT_GAS=true npx hardhat test
```

## 🚀 Deployment

### Using Hardhat Ignition

The system uses Hardhat Ignition for professional deployment:

```bash
# Deploy to local network
npx hardhat ignition deploy ignition/modules/VaultSystem.ts

# Deploy to testnet
npx hardhat ignition deploy ignition/modules/VaultSystem.ts --network sepolia

# Deploy individual components
npx hardhat ignition deploy ignition/modules/Vault.ts --parameters vault-params.json
```

### Deployment Modules

- `VaultSystem.ts` - Complete system deployment
- `Vault.ts` - Vault contract only
- `Strategies.ts` - Strategy contract only
- `MockToken.ts` - Token deployment
- `MockProtocol.ts` - Protocol deployment

### Environment Variables

```bash
# For testnet/mainnet deployment
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.dev
ETHERSCAN_API_KEY=your_etherscan_key

# For contract interaction
VAULT_ADDRESS=0x...
STRATEGIES_ADDRESS=0x...
UNDERLYING_TOKEN_ADDRESS=0x...
```

## 🔐 Security Features

### Access Control

- **Owner**: Can grant/revoke roles
- **Manager**: Can add/remove strategies
- **Agent**: Can execute strategies and harvest rewards
- **Users**: Can deposit/withdraw from vault

### Safety Mechanisms

- **Reentrancy Protection**: All state-changing functions protected
- **Pause Functionality**: Emergency pause for strategies
- **Emergency Exit**: Safe withdrawal from protocols
- **Input Validation**: Comprehensive parameter checking
- **Role Verification**: Strict access control enforcement

### Audit Considerations

- OpenZeppelin contracts for security standards
- Comprehensive test coverage (97 tests)
- Gas optimization with safety limits
- Error handling and graceful failures
- Event emission for transparency

## 🔄 Integration Examples

### Adding a New Protocol

```typescript
// Deploy strategy for Compound
const compoundStrategy = await Strategies.deploy(
  underlyingToken.address,
  compoundProtocol.address,
  ethers.id("mint(uint256)").slice(0, 10), // deposit
  ethers.id("redeem(uint256)").slice(0, 10), // withdraw
  ethers.id("claimComp()").slice(0, 10), // claim
  ethers.id("balanceOf(address)").slice(0, 10) // getBalance
);
```

### Custom Strategy Execution

```typescript
// Execute with custom data
const customData = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256", "uint16"],
  [asset, amount, referralCode]
);

await vault
  .connect(agent)
  .depositToStrategy(strategy.address, amount, customData);
```

## 📊 Performance

### Gas Optimization

- **Efficient Storage**: Packed structs and optimized layouts
- **Batch Operations**: Multiple operations in single transaction
- **Selective Updates**: Only update necessary state
- **View Function Optimization**: Minimal external calls

### Benchmarks

- Vault deposit: ~150k gas
- Strategy execution: ~200k gas
- Harvest operation: ~300k gas
- Emergency exit: ~250k gas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure all tests pass
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run tests in watch mode
npx hardhat test --watch

# Run linter
npm run lint

# Format code
npm run format
```

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Hardhat Ignition](https://hardhat.org/ignition)

---

**Built with ❤️ for the DeFi ecosystem**
