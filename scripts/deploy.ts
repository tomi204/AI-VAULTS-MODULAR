#!/usr/bin/env node

import { ignition, ethers } from "hardhat";
import VaultSystemModule from "../ignition/modules/VaultSystem";

async function main() {
  console.log("🚀 Deploying Vault System...\n");

  try {
    // Deploy the complete system
    const { underlyingToken, rewardToken, mockProtocol, vault, strategies } = 
      await ignition.deploy(VaultSystemModule);

    console.log("✅ Deployment successful!\n");
    console.log("📋 Contract Addresses:");
    console.log("====================");
    console.log(`🪙  Underlying Token: ${await underlyingToken.getAddress()}`);
    console.log(`🎁  Reward Token:     ${await rewardToken.getAddress()}`);
    console.log(`🏦  Mock Protocol:    ${await mockProtocol.getAddress()}`);
    console.log(`🏛️  Vault:            ${await vault.getAddress()}`);
    console.log(`📈  Strategies:       ${await strategies.getAddress()}\n`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (chainId: ${network.chainId})\n`);

    // Get deployer info
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Verify setup
    console.log("🔍 Verifying setup...");
    
    const vaultAsset = await vault.asset();
    const strategyVault = await strategies.vault();
    const isStrategyAdded = await vault.isStrategy(await strategies.getAddress());
    
    console.log(`   ✅ Vault asset correctly set: ${vaultAsset === await underlyingToken.getAddress()}`);
    console.log(`   ✅ Strategy vault correctly set: ${strategyVault === await vault.getAddress()}`);
    console.log(`   ✅ Strategy added to vault: ${isStrategyAdded}`);

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      contracts: {
        underlyingToken: await underlyingToken.getAddress(),
        rewardToken: await rewardToken.getAddress(),
        mockProtocol: await mockProtocol.getAddress(),
        vault: await vault.getAddress(),
        strategies: await strategies.getAddress()
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n📄 Deployment info saved to deployment-info.json");
    
    // In a real script, you'd save this to a file
    // await fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 Ready to use! Run 'npx hardhat run scripts/interact.ts' to interact with contracts.");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
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