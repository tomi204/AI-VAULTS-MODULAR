import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import "dotenv/config";

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
    // Flow networks
    flow: {
      url: process.env.FLOW_RPC_URL || "https://mainnet.evm.nodes.onflow.org",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 545,
    },
    flowTestnet: {
      url:
        process.env.FLOW_TESTNET_RPC_URL ||
        "https://testnet.evm.nodes.onflow.org",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 545,
    },
    // Rootstock networks
    rootstock: {
      url: process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 30,
      gasPrice: 60000000, // 0.06 gwei
    },
    rootstockTestnet: {
      url:
        process.env.ROOTSTOCK_TESTNET_RPC_URL ||
        "https://public-node.testnet.rsk.co",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 31,
      gasPrice: 60000000, // 0.06 gwei
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
