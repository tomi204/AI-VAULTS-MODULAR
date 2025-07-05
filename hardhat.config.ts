import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import "dotenv/config";
import "@tableland/hardhat";

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
          viaIR: true,
        },
      },
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  localTableland: {
    silent: false,
    verbose: false,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "local-tableland": {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    calibration: {
      url:
        process.env.CALIBRATION_RPC_URL ||
        "https://rpc.ankr.com/filecoin_testnet",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 314159,
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
