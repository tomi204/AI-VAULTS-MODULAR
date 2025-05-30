# Vault and Strategies System

This project implements a flexible vault system with modular strategies for interacting with DeFi protocols.

## Overview

The system consists of:

- **Vault.sol**: An ERC4626 compliant vault with role-based access control
- **Strategies.sol**: A generic strategy implementation that can interact with any protocol
- **MockProtocol.sol**: A mock DeFi protocol for testing
- **MockToken.sol**: ERC20 tokens for testing

## Architecture

```
User → Vault → Strategy → Protocol
```

### Key Features:

- ERC4626 compliant vault for standardized deposits/withdrawals
- Role-based access control (Manager and Agent roles)
- Generic strategy that can work with any protocol
- Emergency exit functionality
- Reward token harvesting and forwarding
- Pausable strategies

## Running Tests

1. Install dependencies:

```bash
npm install
```

2. Compile contracts:

```bash
npx hardhat compile
```

3. Run all tests:

```bash
npx hardhat test
```

4. Run specific test file:

```bash
npx hardhat test test/MockProtocol.test.ts
npx hardhat test test/Vault.test.ts
npx hardhat test test/Strategies.test.ts
```

5. Run tests with coverage:

```bash
npx hardhat coverage
```

## Test Coverage

The test suite includes:

- **MockProtocol Tests**: Basic protocol functionality
- **Vault Tests**: ERC4626 operations, strategy management, role management
- **Strategies Tests**: Deposits, withdrawals, harvesting, emergency exits

## Deployment

1. Configure your `.env` file with:

```
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
```

2. Deploy contracts:

```bash
npx hardhat run scripts/deploy.ts --network <network_name>
```

## Usage Example

```typescript
// Deploy tokens
const underlyingToken = await TokenFactory.deploy("DAI", "DAI");
const rewardToken = await TokenFactory.deploy("Reward", "RWD");

// Deploy protocol
const protocol = await ProtocolFactory.deploy(underlyingToken, rewardToken);

// Deploy strategy
const strategy = await StrategyFactory.deploy(
  underlyingToken,
  protocol,
  depositSelector,
  withdrawSelector,
  claimSelector,
  getBalanceSelector
);

// Deploy vault
const vault = await VaultFactory.deploy(
  underlyingToken,
  "Vault DAI",
  "vDAI",
  managerAddress,
  agentAddress
);

// Connect strategy to vault
await strategy.setVault(vault);
await vault.addStrategy(strategy);

// Users can now deposit into vault
await underlyingToken.approve(vault, amount);
await vault.deposit(amount, userAddress);

// Agent can execute strategies
await vault.executeStrategy(strategy, executeData);
```

## Security Considerations

- Only the Manager role can add/remove strategies
- Only the Agent role can execute strategies and harvest rewards
- Strategies can be paused in case of emergencies
- Emergency exit allows withdrawal of all funds from protocols
- All functions have proper access control and input validation

## License

MIT
