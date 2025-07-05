import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function deployMockTokens() {
  // Check if USDC address is provided in env
  const usdcAddress = process.env.USDFC_ADDRESS;

  if (usdcAddress) {
    console.log("✅ Using existing USDFC token:", usdcAddress);
    return {
      usdc: usdcAddress,
      wbtc: null, // Not needed for this deployment
      weth: null, // Not needed for this deployment
    };
  }

  // If no USDC address provided, deploy mock tokens
  console.log("🔄 Deploying mock tokens...");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const MockWETH = await ethers.getContractFactory("MockWETH");

  const usdc = await MockUSDC.deploy();
  const wbtc = await MockWBTC.deploy();
  const weth = await MockWETH.deploy();

  await Promise.all([
    usdc.waitForDeployment(),
    wbtc.waitForDeployment(),
    weth.waitForDeployment(),
  ]);

  return {
    usdc: await usdc.getAddress(),
    wbtc: await wbtc.getAddress(),
    weth: await weth.getAddress(),
  };
}

async function deployVault(tokenAddress: string, deployer: any) {
  const manager = process.env.MANAGER_ADDRESS || deployer.address;
  const agent = process.env.AGENT_ADDRESS || deployer.address;
  const vaultName = process.env.VAULT_NAME || "Multi-Token Vault";
  const vaultSymbol = process.env.VAULT_SYMBOL || "ShoUSD";

  console.log("🔄 Deploying Vault...");
  console.log("📋 Vault Configuration:");
  console.log(`  Name: ${vaultName}`);
  console.log(`  Symbol: ${vaultSymbol}`);
  console.log(`  Manager: ${manager}`);
  console.log(`  Agent: ${agent}`);
  console.log(`  Underlying Token: ${tokenAddress}`);

  const VaultFactory = await ethers.getContractFactory("Vault");
  const vault = await VaultFactory.deploy(
    tokenAddress,
    vaultName,
    vaultSymbol,
    manager,
    agent
  );

  await vault.waitForDeployment();
  return vault;
}

async function deployStrategy(underlyingToken: string, vault: any) {
  console.log("🔄 Deploying Strategy...");

  // For now, we'll use a simple MockProtocol
  const MockProtocolFactory = await ethers.getContractFactory("MockProtocol");
  const mockProtocol = await MockProtocolFactory.deploy(
    underlyingToken,
    underlyingToken // Using same token as reward for simplicity
  );

  await mockProtocol.waitForDeployment();
  const protocolAddress = await mockProtocol.getAddress();

  // Deploy Strategy
  const StrategiesFactory = await ethers.getContractFactory("Strategies");
  const strategies = await StrategiesFactory.deploy(
    underlyingToken,
    protocolAddress,
    ethers.id("deposit(uint256)").slice(0, 10), // deposit selector
    ethers.id("withdraw(uint256)").slice(0, 10), // withdraw selector
    ethers.id("claimRewards()").slice(0, 10), // claim selector
    ethers.id("getBalance(address)").slice(0, 10) // getBalance selector
  );

  await strategies.waitForDeployment();

  // Set vault in strategy
  await strategies.setVault(await vault.getAddress());

  return {
    strategy: await strategies.getAddress(),
    protocol: protocolAddress,
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`🚀 Deploying to Filecoin ${networkName.toUpperCase()}`);
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await deployer.provider.getBalance(deployer.address)
    )} FIL`
  );

  try {
    // Deploy or use existing tokens
    const tokens = await deployMockTokens();
    console.log(`✅ Token configuration:`);
    console.log(`  USDFC: ${tokens.usdc}`);
    if (tokens.wbtc) console.log(`  WBTC: ${tokens.wbtc}`);
    if (tokens.weth) console.log(`  WETH: ${tokens.weth}`);

    // Deploy vault with USDFC as underlying asset
    const vault = await deployVault(tokens.usdc, deployer);
    const vaultAddress = await vault.getAddress();
    console.log(`✅ Vault deployed: ${vaultAddress}`);

    // Deploy strategy
    const strategyInfo = await deployStrategy(tokens.usdc, vault);
    console.log(`✅ Strategy deployed: ${strategyInfo.strategy}`);
    console.log(`✅ Mock Protocol deployed: ${strategyInfo.protocol}`);

    // Add strategy to vault
    console.log("🔄 Adding strategy to vault...");
    await vault.addStrategy(strategyInfo.strategy);
    console.log("✅ Strategy added to vault");

    // Create Tableland table
    console.log("🔄 Creating Tableland table...");
    try {
      await vault.createTable();
      console.log("✅ Tableland table created");
    } catch (error) {
      console.log(
        "⚠️  Tableland table creation failed (this is optional):",
        error
      );
    }

    // Summary
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("📋 Contract Addresses:");
    console.log(`  Vault: ${vaultAddress}`);
    console.log(`  Strategy: ${strategyInfo.strategy}`);
    console.log(`  Mock Protocol: ${strategyInfo.protocol}`);
    console.log(`  USDFC: ${tokens.usdc}`);
    if (tokens.wbtc) console.log(`  WBTC: ${tokens.wbtc}`);
    if (tokens.weth) console.log(`  WETH: ${tokens.weth}`);

    console.log("\n📝 Environment Variables:");
    console.log(`FILECOIN_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`FILECOIN_STRATEGY_ADDRESS=${strategyInfo.strategy}`);
    console.log(`USDFC_ADDRESS=${tokens.usdc}`);
    if (tokens.wbtc) console.log(`FILECOIN_WBTC_ADDRESS=${tokens.wbtc}`);
    if (tokens.weth) console.log(`FILECOIN_WETH_ADDRESS=${tokens.weth}`);

    console.log("\n🔗 Next Steps:");
    console.log("1. Fund the vault with tokens");
    console.log("2. Test strategy execution");
    console.log("3. Monitor performance on Filecoin explorer");
    console.log("   - Beryx Explorer: https://beryx.zondax.ch/");
    console.log("   - Filfox Explorer: https://calibration.filfox.info/en");
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
