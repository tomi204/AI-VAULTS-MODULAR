import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Ethereum networks
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.dev",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    // Arbitrum networks
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    // Base networks
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    // Flow networks
    flow: {
      url: process.env.FLOW_RPC_URL || 'https://mainnet.evm.nodes.onflow.org',
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    flowTestnet: {
      url: process.env.FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  ignition: {
    requiredConfirmations: 1,
  },
};

export default config;
