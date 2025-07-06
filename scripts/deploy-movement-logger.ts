import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function deployMockDecisionRegistry(deployer: any) {
  console.log("🔄 Deploying Mock Decision Registry...");
  
  const MockDecisionRegistry = await ethers.getContractFactory("MockDecisionRegistry");
  const registry = await MockDecisionRegistry.deploy();
  
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  
  console.log(`✅ Mock Decision Registry deployed: ${registryAddress}`);
  return registryAddress;
}

async function deployMovementLogger(registryAddress: string, keeperAddress: string, deployer: any) {
  console.log("🔄 Deploying Movement Logger...");
  console.log("📋 Movement Logger Configuration:");
  console.log(`  Registry: ${registryAddress}`);
  console.log(`  Keeper: ${keeperAddress}`);
  
  const MovementLogger = await ethers.getContractFactory("MovementLogger");
  const movementLogger = await MovementLogger.deploy(
    registryAddress,
    keeperAddress
  );
  
  await movementLogger.waitForDeployment();
  const loggerAddress = await movementLogger.getAddress();
  
  console.log(`✅ Movement Logger deployed: ${loggerAddress}`);
  return movementLogger;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`🚀 Deploying Movement Logger to Filecoin ${networkName.toUpperCase()}`);
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await deployer.provider.getBalance(deployer.address)
    )} FIL`
  );

  try {
    // Get keeper address from environment or use deployer
    const keeperAddress = '0x4416b4D774E2B3C0FF922ADC3bc136cfdA55C7db';
    console.log(`🤖 Keeper Address: ${keeperAddress}`);

    // Deploy Mock Decision Registry
    const registryAddress = await deployMockDecisionRegistry(deployer);

    // Deploy Movement Logger
    const movementLogger = await deployMovementLogger(registryAddress, keeperAddress, deployer);
    const loggerAddress = await movementLogger.getAddress();

    // Get table ID from the deployed contract
    const tableId = await movementLogger.tableId();
    console.log(`📊 Tableland Table ID: ${tableId}`);

    // Summary
    console.log("\n🎉 MOVEMENT LOGGER DEPLOYMENT COMPLETE!");
    console.log("📋 Contract Addresses:");
    console.log(`  Movement Logger: ${loggerAddress}`);
    console.log(`  Mock Decision Registry: ${registryAddress}`);
    console.log(`  Keeper: ${keeperAddress}`);
    console.log(`  Tableland Table ID: ${tableId}`);

    console.log("\n📝 Environment Variables:");
    console.log(`MOVEMENT_LOGGER_ADDRESS=${loggerAddress}`);
    console.log(`DECISION_REGISTRY_ADDRESS=${registryAddress}`);
    console.log(`KEEPER_ADDRESS=${keeperAddress}`);
    console.log(`TABLELAND_TABLE_ID=${tableId}`);

    console.log("\n🔗 Next Steps:");
    console.log("1. Test the Movement Logger with sample data");
    console.log("2. Verify keeper permissions");
    console.log("3. Check Tableland table creation");
    console.log("4. Monitor logs on Filecoin explorer");
    console.log("   - Beryx Explorer: https://beryx.zondax.ch/");
    console.log("   - Filfox Explorer: https://calibration.filfox.info/en");

    console.log("\n🧪 Test Commands:");
    console.log("1. Test logging a movement:");
    console.log(`   await movementLogger.logMovement(`);
    console.log(`     "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",`);
    console.log(`     "0x${deployer.address.slice(2)}",`);
    console.log(`     314159, // Filecoin chain ID`);
    console.log(`     ${await deployer.provider.getBlockNumber()},`);
    console.log(`     "0x0000000000000000000000000000000000000000",`);
    console.log(`     "Test movement",`);
    console.log(`     "${new Date().toISOString()}",`);
    console.log(`     "LOW",`);
    console.log(`     ethers.parseEther("1.0")`);
    console.log(`   );`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 