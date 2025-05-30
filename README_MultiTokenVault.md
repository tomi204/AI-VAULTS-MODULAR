# MultiTokenVault System

## Overview

El MultiTokenVault es un sistema de vault avanzado que extiende las capacidades del `Vault.sol` original para soportar múltiples tokens (ETH y ERC20) con precios en tiempo real proporcionados por el oráculo de Pyth Network.

## Características Principales

### 🔐 Control de Acceso Basado en Roles

- **Owner**: Control total del contrato
- **Manager**: Gestión de estrategias y tokens soportados
- **Agent**: Ejecución de estrategias y operaciones del vault

### 💰 Soporte Multi-Token

- **ETH nativo**: Depósitos y retiros directos
- **Tokens ERC20**: Soporte configurable para cualquier token ERC20
- **Precios en tiempo real**: Integración con Pyth Network para precios actualizados

### 📊 Oráculo de Precios

- **Pyth Network**: Precios descentralizados y de alta frecuencia
- **Conversión USD**: Cálculo automático de valores en USD
- **Configuración flexible**: Price IDs configurables por token

### 🎯 Gestión de Estrategias

- **Estrategias reutilizables**: Misma funcionalidad del Vault original
- **Ejecución multi-token**: Estrategias pueden trabajar con diferentes tokens
- **Emergencia**: Funciones de salida de emergencia

## Arquitectura del Sistema

```
┌─────────────────────┐    ┌──────────────────────┐
│   MultiTokenVault   │────│  PythPriceOracle    │
│                     │    │                      │
│ - ETH Support       │    │ - Price Feeds        │
│ - ERC20 Support     │    │ - USD Conversion     │
│ - User Balances     │    │ - Token Config       │
│ - Strategy Mgmt     │    └──────────────────────┘
└─────────────────────┘               │
          │                           │
          │                    ┌──────▼──────┐
          │                    │ Pyth Network│
          │                    │ (On-chain)  │
          └────────────────────┴─────────────┘
```

## Contratos Principales

### 1. MultiTokenVault.sol

El contrato principal que maneja:

- Depósitos y retiros de ETH y tokens ERC20
- Balances de usuarios por token
- Integración con estrategias
- Control de acceso basado en roles

### 2. PythPriceOracle.sol

Oráculo que provee:

- Precios en tiempo real desde Pyth Network
- Conversiones de token a USD
- Configuración de Price IDs por token

### 3. Interfaces

- `IMultiTokenVault.sol`: Interfaz del vault multi-token
- `IPythPriceOracle.sol`: Interfaz del oráculo de precios

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install @pythnetwork/pyth-sdk-solidity @openzeppelin/contracts
```

### 2. Direcciones de Pyth por Red

```typescript
// Ethereum Mainnet
const PYTH_ADDRESS = "0x4305FB66699C3B2702D4d05CF36551390A4c69C6";

// Otras redes - consultar: https://docs.pyth.network/documentation/pythnet-price-feeds/evm
```

### 3. Price IDs Comunes

```typescript
const PRICE_IDS = {
  "ETH/USD":
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "BTC/USD":
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "USDC/USD":
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  "USDT/USD":
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
};
```

## Uso del Sistema

### Despliegue

```typescript
// 1. Desplegar PythPriceOracle
const priceOracle = await PythPriceOracle.deploy(PYTH_ADDRESS);

// 2. Desplegar MultiTokenVault
const vault = await MultiTokenVault.deploy(
  managerAddress,
  agentAddress,
  priceOracle.address
);

// 3. Configurar tokens soportados (como Manager)
await vault.connect(manager).addSupportedToken(tokenAddress, priceId, decimals);
```

### Operaciones de Usuario

```typescript
// Depositar ETH
await vault.depositETH({ value: ethers.parseEther("1.0") });

// Depositar Token ERC20
await token.approve(vault.address, amount);
await vault.depositToken(token.address, amount);

// Retirar ETH
await vault.withdrawETH(ethers.parseEther("0.5"));

// Retirar Token ERC20
await vault.withdrawToken(token.address, amount);

// Consultar balance en USD
const userValueUSD = await vault.getUserTotalValueUSD(userAddress);
```

### Gestión de Tokens (Solo Manager)

```typescript
// Agregar token soportado
await vault.addSupportedToken(
  "0xA0b86a33E6441e30F698B5D6230e4BB4dA96E5C0", // USDC
  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USDC/USD Price ID
  6 // USDC decimals
);

// Remover token
await vault.removeSupportedToken(tokenAddress);

// Ver tokens soportados
const tokens = await vault.getSupportedTokens();
```

### Estrategias (Solo Agent)

```typescript
// Ejecutar estrategia
await vault.executeStrategy(strategyAddress, data);

// Depositar a estrategia
await vault.depositToStrategy(strategyAddress, tokenAddress, amount, data);

// Harvest estrategia
await vault.harvestStrategy(strategyAddress, data);
```

## Funciones de Vista

```typescript
// Valor total del vault en USD
const totalVaultValue = await vault.getTotalVaultValueUSD();

// Valor total de un usuario en USD
const userValue = await vault.getUserTotalValueUSD(userAddress);

// Balance de token específico
const tokenBalance = await vault.getUserTokenBalance(userAddress, tokenAddress);

// Balance de ETH
const ethBalance = await vault.getUserETHBalance(userAddress);

// Información de token
const tokenInfo = await vault.getTokenInfo(tokenAddress);

// Verificar si token está soportado
const isSupported = await vault.isTokenSupported(tokenAddress);
```

## Consideraciones de Seguridad

### 1. Control de Acceso

- Roles bien definidos con permisos específicos
- Owner puede cambiar el oráculo de precios
- Manager gestiona tokens y estrategias
- Agent ejecuta operaciones operativas

### 2. Protección contra Reentrancy

- Uso de `ReentrancyGuard` en funciones críticas
- Patrón checks-effects-interactions

### 3. Validación de Precios

- Edad máxima de precios configurada
- Validación de precios positivos
- Manejo de errores de oráculo

### 4. Gestión de Tokens

- Validación de direcciones
- Verificación de tokens soportados
- SafeERC20 para transferencias seguras

## Direcciones de Pyth por Red

| Red       | Dirección del Contrato Pyth                  |
| --------- | -------------------------------------------- |
| Ethereum  | `0x4305FB66699C3B2702D4d05CF36551390A4c69C6` |
| Arbitrum  | `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C` |
| Avalanche | `0x4305FB66699C3B2702D4d05CF36551390A4c69C6` |
| BSC       | `0x4D7E825f80bDf85e913E0DD2A2D54927e9dE1594` |
| Polygon   | `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C` |

Para más redes, consultar: [Pyth EVM Documentation](https://docs.pyth.network/documentation/pythnet-price-feeds/evm)

## Recursos Adicionales

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Price Feed IDs](https://pyth.network/developers/price-feed-ids)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Ejemplos de Uso Avanzado

### Crear una Estrategia Custom

```solidity
contract MyCustomStrategy is IStrategies {
    function execute(uint256 amount, bytes calldata data) external override {
        // Lógica de la estrategia
    }

    function harvest(bytes calldata data) external override {
        // Lógica de harvest
    }

    function emergencyExit(bytes calldata data) external override {
        // Lógica de salida de emergencia
    }
}
```

### Monitoreo de Precios

```typescript
// Obtener precio actual de un token
const [price, decimals] = await priceOracle.getTokenPrice(
  tokenAddress,
  1500 // Max age in seconds
);

console.log(`Token price: $${price / 10 ** decimals}`);
```

Este sistema proporciona una base sólida para un vault multi-token con precios en tiempo real, manteniendo la compatibilidad con el sistema de estrategias existente.
