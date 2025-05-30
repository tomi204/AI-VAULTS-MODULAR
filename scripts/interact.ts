#!/usr/bin/env node

import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";

// Contract addresses - these would typically be loaded from deployment info
const CONTRACTS = {
  // These will be filled after deployment or loaded from deployment-info.json
  underlyingToken: process.env.UNDERLYING_TOKEN_ADDRESS || "",
  rewardToken: process.env.REWARD_TOKEN_ADDRESS || "",
  mockProtocol: process.env.MOCK_PROTOCOL_ADDRESS || "",
  vault: process.env.VAULT_ADDRESS || "",
  strategies: process.env.STRATEGIES_ADDRESS || ""
};

async function main() {
  console.log("🏛️ Vault System CLI Interaction Tool\n");
  
  // Get signers
  const [deployer, manager, agent, user] = await ethers.getSigners();
  
  console.log("👥 Available accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Manager:  ${manager.address}`);
  console.log(`   Agent:    ${agent.address}`);
  console.log(`   User:     ${user.address}\n`);

  // Check if contracts are set
  if (!CONTRACTS.vault) {
    console.log("⚠️  Contract addresses not found. Please:");
    console.log("1. Deploy contracts first: npx hardhat run scripts/deploy.ts");
    console.log("2. Set environment variables or update contract addresses in this script\n");
    return;
  }

  try {
    // Get contract instances
    const underlyingToken = await ethers.getContractAt("MockToken", CONTRACTS.underlyingToken);
    const rewardToken = await ethers.getContractAt("MockToken", CONTRACTS.rewardToken);
    const mockProtocol = await ethers.getContractAt("MockProtocol", CONTRACTS.mockProtocol);
    const vault = await ethers.getContractAt("Vault", CONTRACTS.vault);
    const strategies = await ethers.getContractAt("Strategies", CONTRACTS.strategies);

    console.log("✅ Connected to contracts\n");

    // Display current state
    await displaySystemState(underlyingToken, rewardToken, vault, strategies, user);

    // Interactive menu
    const action = process.argv[2];
    
    switch (action) {
      case "deposit":
        await depositToVault(underlyingToken, vault, user);
        break;
      case "withdraw":
        await withdrawFromVault(vault, user);
        break;
      case "deploy-to-strategy":
        await deployToStrategy(vault, strategies, agent);
        break;
      case "harvest":
        await harvestStrategy(vault, strategies, agent);
        break;
      case "emergency-exit":
        await emergencyExit(vault, strategies, agent);
        break;
      case "status":
        // Already displayed above
        break;
      default:
        displayUsage();
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function displaySystemState(underlyingToken: any, rewardToken: any, vault: any, strategies: any, user: any) {
  console.log("📊 Current System State");
  console.log("=====================");
  
  // Token balances
  const userUnderlyingBalance = await underlyingToken.balanceOf(user.address);
  const userRewardBalance = await rewardToken.balanceOf(user.address);
  const userVaultShares = await vault.balanceOf(user.address);
  
  console.log(`💰 User Balances:`);
  console.log(`   Underlying: ${formatEther(userUnderlyingBalance)} tokens`);
  console.log(`   Rewards:    ${formatEther(userRewardBalance)} tokens`);
  console.log(`   Vault Shares: ${formatEther(userVaultShares)} shares`);
  
  // Vault state
  const vaultAssets = await vault.totalAssets();
  const vaultShares = await vault.totalSupply();
  
  console.log(`🏛️ Vault State:`);
  console.log(`   Total Assets: ${formatEther(vaultAssets)} tokens`);
  console.log(`   Total Shares: ${formatEther(vaultShares)} shares`);
  
  // Strategy state
  const strategyBalance = await strategies.getBalance();
  const isStrategyPaused = await strategies.paused();
  
  console.log(`📈 Strategy State:`);
  console.log(`   Protocol Balance: ${formatEther(strategyBalance)} tokens`);
  console.log(`   Paused: ${isStrategyPaused}`);
  
  console.log("");
}

async function depositToVault(underlyingToken: any, vault: any, user: any) {
  const amount = parseEther("100"); // Default 100 tokens
  
  console.log(`💰 Depositing ${formatEther(amount)} tokens to vault...`);
  
  // Approve and deposit
  await underlyingToken.connect(user).approve(await vault.getAddress(), amount);
  await vault.connect(user).deposit(amount, user.address);
  
  console.log("✅ Deposit successful!");
}

async function withdrawFromVault(vault: any, user: any) {
  const amount = parseEther("50"); // Default 50 tokens
  
  console.log(`💸 Withdrawing ${formatEther(amount)} tokens from vault...`);
  
  await vault.connect(user).withdraw(amount, user.address, user.address);
  
  console.log("✅ Withdrawal successful!");
}

async function deployToStrategy(vault: any, strategies: any, agent: any) {
  const amount = parseEther("100"); // Default 100 tokens
  
  console.log(`📈 Deploying ${formatEther(amount)} tokens to strategy...`);
  
  await vault.connect(agent).depositToStrategy(await strategies.getAddress(), amount, "0x");
  
  console.log("✅ Strategy deployment successful!");
}

async function harvestStrategy(vault: any, strategies: any, agent: any) {
  console.log("🌾 Harvesting strategy rewards...");
  
  await vault.connect(agent).harvestStrategy(await strategies.getAddress(), "0x");
  
  console.log("✅ Harvest successful!");
}

async function emergencyExit(vault: any, strategies: any, agent: any) {
  console.log("🚨 Performing emergency exit...");
  
  await vault.connect(agent).emergencyExitStrategy(await strategies.getAddress(), "0x");
  
  console.log("✅ Emergency exit successful!");
}

function displayUsage() {
  console.log("🔧 Usage:");
  console.log("npx hardhat run scripts/interact.ts -- <action>");
  console.log("");
  console.log("Available actions:");
  console.log("  status              - Show current system state");
  console.log("  deposit             - Deposit tokens to vault");
  console.log("  withdraw            - Withdraw tokens from vault"); 
  console.log("  deploy-to-strategy  - Deploy vault funds to strategy");
  console.log("  harvest             - Harvest strategy rewards");
  console.log("  emergency-exit      - Emergency exit from strategy");
  console.log("");
  console.log("Examples:");
  console.log("  npx hardhat run scripts/interact.ts -- status");
  console.log("  npx hardhat run scripts/interact.ts -- deposit");
  console.log("  npx hardhat run scripts/interact.ts -- harvest");
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 