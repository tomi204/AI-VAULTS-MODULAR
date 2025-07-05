# Filecoin Testnet Deployment Guide

## 🚀 Deploying AI Vaults to Filecoin Calibration Testnet

### Prerequisites

1. **Node.js and npm/yarn** installed
2. **MetaMask** or another Ethereum wallet
3. **Private key** from your wallet
4. **Test FIL** tokens from the faucet

### Configuration

1. **Set up your environment variables:**

   ```bash
   export PRIV_KEY=your_private_key_here
   export CALIBRATION_RPC_URL=https://rpc.ankr.com/filecoin_testnet
   export MANAGER_ADDRESS=0xb70649baF7A93EEB95E3946b3A82F8F312477d2b
   export AGENT_ADDRESS=0x4416b4D774E2B3C0FF922ADC3bc136cfdA55C7db
   export VAULT_NAME="Multi-Token Vault"
   export VAULT_SYMBOL="ShoUSD"
   export USDFC_ADDRESS=0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0
   ```

### Network Configuration

The project is configured for Filecoin Calibration Testnet:

- **Chain ID**: 314159 (0x4cb2f)
- **RPC URL**: https://rpc.ankr.com/filecoin_testnet
- **Currency**: tFIL (test FIL)
- **Block Explorer**: https://beryx.io/fil/calibration

### Getting Test Tokens

1. **Get your address:**

   ```bash
   npx hardhat console --network calibration
   ```

   Then in the console:

   ```javascript
   const [deployer] = await ethers.getSigners();
   console.log("Address:", deployer.address);
   ```

2. **Get test FIL from faucet:**
   - Go to: https://beryx.io/faucet
   - Enter your Ethereum address
   - Request test FIL

### Deployment Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Compile contracts:**

   ```bash
   npm run compile
   ```

3. **Deploy to Filecoin Calibration:**

   ```bash
   npm run deploy:filecoin
   ```

   Or alternatively:

   ```bash
   npx hardhat run scripts/deploy-filecoin.ts --network calibration
   ```

### What Gets Deployed

The deployment script will deploy:

1. **Vault Contract:**

   - ERC4626 compliant vault
   - Uses existing USDC token (0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0)
   - Supports multiple strategies
   - Integrated with Tableland for data tracking
   - Configured with your Manager and Agent addresses

2. **Strategy Contract:**

   - Generic strategy implementation
   - Connected to MockProtocol
   - Configured for USDC

3. **MockProtocol:**
   - Simulates a DeFi protocol
   - Supports deposit/withdraw/claim operations

**Note:** The script will use your existing USDC token instead of deploying mock tokens.

### After Deployment

After successful deployment, you'll get:

```
🎉 DEPLOYMENT COMPLETE!
📋 Contract Addresses:
  Vault: 0x...
  Strategy: 0x...
  Mock Protocol: 0x...
  USDC: 0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0
```

### Testing the Deployment

1. **Check deployment status:**

   ```bash
   npm run status
   ```

2. **Interact with contracts:**

   ```bash
   npm run interact
   ```

3. **Monitor on explorers:**
   - Beryx Explorer: https://beryx.io/fil/calibration
   - Filfox Explorer: https://calibration.filfox.info/en

### Troubleshooting

#### Common Issues

1. **Insufficient balance:**

   - Make sure you have enough test FIL
   - Check balance: `npx hardhat console --network calibration`

2. **Gas estimation failed:**

   - Filecoin might require higher gas limits
   - The script handles this automatically

3. **RPC connection issues:**
   - Check network connectivity
   - Try alternative RPC: https://filecoin-calibration.chainstacklabs.com/rpc/v1

#### Network Configuration for MetaMask

If you want to add Filecoin Calibration to MetaMask:

- **Network Name**: Filecoin Calibration
- **RPC URL**: https://rpc.ankr.com/filecoin_testnet
- **Chain ID**: 314159
- **Currency Symbol**: tFIL
- **Block Explorer**: https://beryx.io/fil/calibration

### Next Steps

1. **Fund the vault** with test tokens
2. **Test strategy execution**
3. **Monitor performance** on Filecoin explorers
4. **Integrate with frontend** applications

### Useful Resources

- [Filecoin Documentation](https://docs.filecoin.io/)
- [FEVM Developer Resources](https://github.com/filecoin-project/fevm-hardhat-kit)
- [Filecoin Calibration Network](https://docs.filecoin.io/networks/calibration/)
- [Beryx Explorer](https://beryx.io/fil/calibration)
- [Filfox Explorer](https://calibration.filfox.info/en)

### Support

For issues or questions:

- Check the GitHub issues
- Join the Filecoin Slack community
- Review the Filecoin documentation
