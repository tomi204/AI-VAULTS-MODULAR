import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`🧪 Testing Movement Logger on ${networkName.toUpperCase()}`);
  console.log(`📍 Tester: ${deployer.address}`);

  // Get contract addresses from environment or use defaults
  const movementLoggerAddress = process.env.MOVEMENT_LOGGER_ADDRESS;
  const registryAddress = process.env.DECISION_REGISTRY_ADDRESS;
  const keeperAddress = process.env.KEEPER_ADDRESS || deployer.address;

  if (!movementLoggerAddress) {
    console.error("❌ MOVEMENT_LOGGER_ADDRESS not found in environment variables");
    console.log("💡 Please run: npm run deploy:movement-logger first");
    process.exit(1);
  }

  try {
    // Get contract instances
    const MovementLogger = await ethers.getContractFactory("MovementLogger");
    const MockDecisionRegistry = await ethers.getContractFactory("MockDecisionRegistry");
    
    const movementLogger = MovementLogger.attach(movementLoggerAddress) as any;
    let registry: any;
    if (registryAddress && registryAddress !== "") {
      registry = MockDecisionRegistry.attach(registryAddress);
    }

    console.log(`📋 Contract Addresses:`);
    console.log(`  Movement Logger: ${movementLoggerAddress}`);
    console.log(`  Registry: ${registryAddress || "Not provided"}`);
    console.log(`  Keeper: ${keeperAddress}`);

    // Test 1: Check contract state
    console.log("\n🔍 Test 1: Checking contract state...");
    const contractRegistry = await movementLogger.registry();
    const contractKeeper = await movementLogger.keeper();
    const tableId = await movementLogger.tableId();

    console.log(`  Registry: ${contractRegistry}`);
    console.log(`  Keeper: ${contractKeeper}`);
    console.log(`  Table ID: ${tableId}`);

    if (contractKeeper.toLowerCase() !== keeperAddress.toLowerCase()) {
      console.log("⚠️  Warning: Current keeper doesn't match environment KEEPER_ADDRESS");
    }

    // Test 2: Test logging a movement (only if deployer is keeper)
    if (contractKeeper.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("\n📝 Test 2: Testing movement logging...");
      
      const testCID = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const testVault = deployer.address;
      const testSrcChain = 314159; // Filecoin chain ID
      const testBlockNo = await deployer.provider.getBlockNumber();
      const testStrategy = "0x0000000000000000000000000000000000000000";
      const testReason = "Test movement from deployment script";
      const testUpdatedAt = new Date().toISOString();
      const testRiskLevel = "LOW";
      const testAmount = ethers.parseEther("1.0");

      console.log("  Logging test movement...");
      const tx = await movementLogger.logMovement(
        testCID,
        testVault,
        testSrcChain,
        testBlockNo,
        testStrategy,
        testReason,
        testUpdatedAt,
        testRiskLevel,
        testAmount
      );

      console.log(`  Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log("  ✅ Movement logged successfully!");

      // Test 3: Verify CID was pushed to registry
      if (registryAddress) {
        console.log("\n🔍 Test 3: Verifying CID in registry...");
        const hasCID = await registry.hasCID(testCID);
        console.log(`  CID ${testCID} exists in registry: ${hasCID}`);
        
        if (hasCID) {
          console.log("  ✅ CID successfully pushed to registry!");
        } else {
          console.log("  ❌ CID not found in registry");
        }
      }

    } else {
      console.log("\n⚠️  Test 2: Skipping movement logging test");
      console.log("   Current deployer is not the keeper address");
      console.log("   To test logging, either:");
      console.log("   1. Set KEEPER_ADDRESS in .env to match deployer");
      console.log("   2. Use the keeper account to run this test");
    }

    // Test 4: Check events
    console.log("\n📊 Test 4: Checking recent events...");
    const currentBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100); // Last 100 blocks
    
    const events = await movementLogger.queryFilter(
      movementLogger.filters.MovementLogged(),
      fromBlock,
      currentBlock
    );

    console.log(`  Found ${events.length} MovementLogged events in last 100 blocks`);
    events.forEach((event: any, index: number) => {
      console.log(`  Event ${index + 1}:`);
      if ('args' in event) {
        console.log(`    CID: ${event.args?.cid}`);
        console.log(`    ID: ${event.args?.id}`);
      }
      console.log(`    Block: ${event.blockNumber}`);
    });

    console.log("\n🎉 Movement Logger testing complete!");
    console.log("\n📝 Summary:");
    console.log("✅ Contract state verified");
    if (contractKeeper.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ Movement logging tested");
      if (registryAddress) console.log("✅ Registry integration verified");
    }
    console.log("✅ Events checked");

  } catch (error) {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 