import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

interface TokenConfig {
  decimals: number;
  priceId: string;
  faucetAmount: string;
}

interface ChainConfig {
  chainId: number;
  pyth: string;
  tokens: Record<string, string>;
  vaults: Record<string, string>;
}

interface DeploymentData {
  chains: Record<string, ChainConfig>;
  priceIds: Record<string, string>;
  tokenConfig: Record<string, TokenConfig>;
}

const DEPLOYMENTS_FILE = path.join(__dirname, "../deployments.json");

// Load deployment data
function loadDeployments(): DeploymentData {
  if (!fs.existsSync(DEPLOYMENTS_FILE)) {
    throw new Error(`Deployments file not found: ${DEPLOYMENTS_FILE}`);
  }
  return JSON.parse(fs.readFileSync(DEPLOYMENTS_FILE, "utf8"));
}

async function main() {
  const networkName = network.name;
  console.log(`🚿 Getting Test Tokens on ${networkName}`);
  console.log("=" + "=".repeat(25 + networkName.length));

  // Load deployment data
  const deploymentData = loadDeployments();
  const chainConfig = deploymentData.chains[networkName];

  if (!chainConfig) {
    console.log(`❌ Network ${networkName} not configured in deployments.json`);
    console.log(
      `Available networks: ${Object.keys(deploymentData.chains).join(", ")}`
    );
    return;
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`\n👤 Account: ${deployer.address}`);

  const tokenNames = ["MockUSDC", "MockWBTC", "MockWETH"];

  // Check current balances
  console.log(`\n📊 Current Balances:`);
  console.log("===================");

  for (const tokenName of tokenNames) {
    const tokenAddress = chainConfig.tokens[tokenName];
    const config = deploymentData.tokenConfig[tokenName];

    if (!tokenAddress) {
      console.log(`❌ ${tokenName}: Not deployed on this network`);
      continue;
    }

    try {
      const token = await ethers.getContractAt(tokenName, tokenAddress);
      const balance = await token.balanceOf(deployer.address);
      const symbol = await token.symbol();
      console.log(
        `  • ${symbol}: ${ethers.formatUnits(balance, config.decimals)}`
      );
    } catch (error) {
      console.log(`  • ${tokenName}: Error reading balance`);
    }
  }

  // Get tokens from faucet
  console.log(`\n🚿 Getting Tokens from Faucet:`);
  console.log("==============================");

  for (const tokenName of tokenNames) {
    const tokenAddress = chainConfig.tokens[tokenName];
    const config = deploymentData.tokenConfig[tokenName];

    if (!tokenAddress) {
      console.log(`⏭️  ${tokenName}: Skipped (not deployed)`);
      continue;
    }

    try {
      const token = await ethers.getContractAt(tokenName, tokenAddress);
      const symbol = await token.symbol();
      const faucetAmount = ethers.parseUnits(
        config.faucetAmount,
        config.decimals
      );

      console.log(`   Getting ${config.faucetAmount} ${symbol}...`);
      const faucetTx = await token.faucet(faucetAmount);
      await faucetTx.wait();

      // Check new balance
      const newBalance = await token.balanceOf(deployer.address);
      console.log(
        `   ✅ Success! New balance: ${ethers.formatUnits(
          newBalance,
          config.decimals
        )} ${symbol}`
      );
    } catch (error: any) {
      console.log(`   ❌ Failed to get ${tokenName}: ${error.message}`);
    }
  }

  // Show final balances
  console.log(`\n📊 Final Balances:`);
  console.log("==================");

  for (const tokenName of tokenNames) {
    const tokenAddress = chainConfig.tokens[tokenName];
    const config = deploymentData.tokenConfig[tokenName];

    if (!tokenAddress) continue;

    try {
      const token = await ethers.getContractAt(tokenName, tokenAddress);
      const balance = await token.balanceOf(deployer.address);
      const symbol = await token.symbol();
      console.log(
        `  • ${symbol}: ${ethers.formatUnits(balance, config.decimals)}`
      );
    } catch (error) {
      console.log(`  • ${tokenName}: Error reading balance`);
    }
  }

  // Show vault shares if vault exists
  const vaultAddress = chainConfig.vaults.MultiTokenVault;
  if (vaultAddress) {
    try {
      const vault = await ethers.getContractAt("MultiTokenVault", vaultAddress);
      const vaultShares = await vault.balanceOf(deployer.address);
      const vaultSymbol = await vault.symbol();
      console.log(`  • ${vaultSymbol}: ${ethers.formatUnits(vaultShares, 6)}`);
    } catch (error) {
      console.log(`  • Vault Shares: Error reading balance`);
    }
  }

  console.log(`\n🎯 Next Steps:`);
  console.log("==============");
  console.log(
    `1. Interact with vault: npx hardhat run scripts/interact-vault.ts --network ${networkName}`
  );
  console.log(
    `2. Check vault status: npx hardhat run scripts/vault-status.ts --network ${networkName}`
  );
  console.log(`3. Get more tokens: Re-run this script anytime`);

  console.log(`\n✨ Token acquisition completed!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Token acquisition failed:", error);
    process.exit(1);
  });
