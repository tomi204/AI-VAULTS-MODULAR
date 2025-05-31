import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

interface ChainConfig {
  chainId: number;
  tokens: Record<string, string>;
  vaults: Record<string, string>;
}

interface DeploymentData {
  chains: Record<string, ChainConfig>;
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
  console.log("=====================================");

  // Load deployment data
  const deploymentData = loadDeployments();
  const chainConfig = deploymentData.chains[networkName];

  if (!chainConfig) {
    throw new Error(
      `Network ${networkName} not configured in deployments.json. Please deploy first.`
    );
  }

  if (!chainConfig.tokens.MockUSDC) {
    throw new Error(
      `MockUSDC not deployed on ${networkName}. Please deploy first.`
    );
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Account: ${signer.address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await signer.provider.getBalance(signer.address)
    )} ${networkName.includes("rootstock") ? "RBTC" : "ETH"}\n`
  );

  // Get MockUSDC contract
  const mockUSDC = await ethers.getContractAt(
    "MockUSDC",
    chainConfig.tokens.MockUSDC
  );

  console.log("🪙 Getting MockUSDC tokens...");
  console.log(`   Contract: ${chainConfig.tokens.MockUSDC}`);

  try {
    // Check current balance
    const currentBalance = await mockUSDC.balanceOf(signer.address);
    console.log(
      `   Current balance: ${ethers.formatUnits(currentBalance, 6)} USDC`
    );

    // Mint 10,000 USDC
    const faucetAmount = ethers.parseUnits("10000", 6);
    console.log("   Requesting 10,000 USDC from faucet...");

    const tx = await mockUSDC.faucet(faucetAmount);
    console.log(`   Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log("   ✅ Transaction confirmed");

    // Check new balance
    const newBalance = await mockUSDC.balanceOf(signer.address);
    console.log(`   New balance: ${ethers.formatUnits(newBalance, 6)} USDC`);
    console.log(
      `   Received: ${ethers.formatUnits(newBalance - currentBalance, 6)} USDC`
    );
  } catch (error: any) {
    console.error(`   ❌ Error getting USDC: ${error.message}`);

    // Try to get more details about the error
    if (error.reason) {
      console.error(`   Reason: ${error.reason}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
  }

  console.log("\n📊 Final Token Balances:");
  console.log("========================");

  try {
    const usdcBalance = await mockUSDC.balanceOf(signer.address);
    console.log(`💰 USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
  } catch (error) {
    console.log("❌ Could not fetch USDC balance");
  }

  console.log("\n🎯 Next Steps:");
  console.log(
    `1. Check vault status: npx hardhat run scripts/simple-vault-status.ts --network ${networkName}`
  );
  console.log(
    `2. Interact with vault: npx hardhat run scripts/interact-simple-vault.ts --network ${networkName}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
