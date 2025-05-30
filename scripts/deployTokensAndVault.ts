import { ethers, network } from "hardhat";

// Network configuration - simplified to always deploy mock tokens
const NETWORK_CONFIG = {
    ethereum: {
        pyth: process.env.ETHEREUM_PYTH_ADDRESS,
    },
    sepolia: {
        pyth: process.env.ETHEREUM_PYTH_ADDRESS,
    },
    arbitrum: {
        pyth: process.env.ARBITRUM_PYTH_ADDRESS,
    },
    arbitrumSepolia: {
        pyth: process.env.ARBITRUM_PYTH_ADDRESS,
    },
    base: {
        pyth: process.env.BASE_PYTH_ADDRESS,
    },
    baseSepolia: {
        pyth: process.env.BASE_PYTH_ADDRESS,
    },
    flow: {
        pyth: process.env.FLOW_PYTH_ADDRESS,
    },
    flowTestnet: {
        pyth: process.env.FLOW_TESTNET_PYTH_ADDRESS,
    },
    hardhat: {
        pyth: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", // Default for testing
    },
    localhost: {
        pyth: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6",
    },
};

// Price IDs (universal across all networks)
const PRICE_IDS = {
    BTC: process.env.BTC_USD_PRICE_ID || "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    ETH: process.env.ETH_USD_PRICE_ID || "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    USDC: process.env.USDC_USD_PRICE_ID || "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
};

async function deployMockTokens() {
    console.log("\n=== Deploying Mock Tokens ===");
    
    const tokens: { [key: string]: string } = {};

    // Deploy Mock USDC
    console.log("🪙 Deploying Mock USDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    tokens.usdc = await usdc.getAddress();
    console.log(`✅ Mock USDC deployed: ${tokens.usdc}`);

    // Deploy Mock WBTC
    console.log("🪙 Deploying Mock WBTC...");
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    tokens.wbtc = await wbtc.getAddress();
    console.log(`✅ Mock WBTC deployed: ${tokens.wbtc}`);

    // Deploy Mock WETH
    console.log("🪙 Deploying Mock WETH...");
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const weth = await MockWETH.deploy();
    await weth.waitForDeployment();
    tokens.weth = await weth.getAddress();
    console.log(`✅ Mock WETH deployed: ${tokens.weth}`);

    return tokens;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = network.name;

    console.log("=".repeat(80));
    console.log(`🚀 DEPLOYING TO: ${networkName.toUpperCase()}`);
    console.log("=".repeat(80));
    console.log(`📍 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ${networkName === 'flow' || networkName === 'flowTestnet' ? 'FLOW' : 'ETH'}`);

    // Get network configuration
    const config = NETWORK_CONFIG[networkName as keyof typeof NETWORK_CONFIG];
    if (!config) {
        throw new Error(`❌ Network '${networkName}' not supported. Please add configuration.`);
    }

    console.log(`✅ Network configuration found for: ${networkName}`);

    // Validate required Pyth address
    if (!config.pyth) {
        throw new Error(`❌ Pyth address not configured for ${networkName}. Please set the environment variable.`);
    }

    console.log(`🔮 Pyth Oracle: ${config.pyth}`);

    // Always deploy mock tokens
    console.log("\n📝 Deploying fresh mock tokens for this deployment...");
    const tokens = await deployMockTokens();

    console.log("\n=== Token Summary ===");
    console.log(`🟡 USDC: ${tokens.usdc} (6 decimals)`);
    console.log(`🟠 WBTC: ${tokens.wbtc} (8 decimals)`);
    console.log(`🔵 WETH: ${tokens.weth} (18 decimals)`);

    // Deploy MultiTokenVault
    console.log("\n=== Deploying MultiTokenVault ===");
    
    const manager = process.env.MANAGER_ADDRESS || deployer.address;
    const agent = process.env.AGENT_ADDRESS || deployer.address;
    const vaultName = process.env.VAULT_NAME || "Multi-Token Vault";
    const vaultSymbol = process.env.VAULT_SYMBOL || "mtvUSDC";

    console.log(`👨‍💼 Manager: ${manager}`);
    console.log(`🤖 Agent: ${agent}`);
    console.log(`🏷️  Name: ${vaultName}`);
    console.log(`🏷️  Symbol: ${vaultSymbol}`);

    const MultiTokenVault = await ethers.getContractFactory("MultiTokenVault");
    const vault = await MultiTokenVault.deploy(
        tokens.usdc,   // USDC address (underlying asset)
        manager,       // Manager address
        agent,         // Agent address
        config.pyth,   // Pyth contract address
        vaultName,     // Vault name
        vaultSymbol    // Vault symbol
    );

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    
    console.log(`✅ MultiTokenVault deployed: ${vaultAddress}`);

    // Configure accepted tokens
    console.log("\n=== Configuring Accepted Tokens ===");
    
    // USDC (no oracle needed, 1:1 conversion)
    console.log("⚙️  Configuring USDC...");
    await vault.configureToken(tokens.usdc, ethers.ZeroHash, 6);
    console.log("✅ USDC configured (1:1, no oracle needed)");

    // WBTC
    console.log("⚙️  Configuring WBTC...");
    try {
        await vault.configureToken(tokens.wbtc, PRICE_IDS.BTC, 8);
        console.log(`✅ WBTC configured with BTC/USD price feed`);
    } catch (error) {
        console.error(`❌ Failed to configure WBTC: ${error}`);
    }

    // WETH
    console.log("⚙️  Configuring WETH...");
    try {
        await vault.configureToken(tokens.weth, PRICE_IDS.ETH, 18);
        console.log(`✅ WETH configured with ETH/USD price feed`);
    } catch (error) {
        console.error(`❌ Failed to configure WETH: ${error}`);
    }

    // Final Summary
    console.log("\n" + "=".repeat(80));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    
    console.log("\n📋 Contract Addresses:");
    console.log(`🏦 MultiTokenVault: ${vaultAddress}`);
    console.log(`🟡 Mock USDC: ${tokens.usdc}`);
    console.log(`🟠 Mock WBTC: ${tokens.wbtc}`);
    console.log(`🔵 Mock WETH: ${tokens.weth}`);
    
    console.log("\n🔧 Configuration:");
    console.log(`🌐 Network: ${networkName}`);
    console.log(`🔮 Pyth Oracle: ${config.pyth}`);
    console.log(`💰 Base Asset: USDC (${tokens.usdc})`);
    console.log(`👨‍💼 Manager: ${manager}`);
    console.log(`🤖 Agent: ${agent}`);
    
    console.log("\n📋 Supported Tokens:");
    console.log(`• USDC → Direct 1:1 deposit (no oracle)`);
    console.log(`• WBTC → Pyth BTC/USD price conversion`);
    console.log(`• WETH → Pyth ETH/USD price conversion`);

    console.log("\n🎁 Testing Features:");
    console.log(`• usdc.faucet(amount) - Get up to 10,000 USDC`);
    console.log(`• wbtc.faucet(amount) - Get up to 1 WBTC`);
    console.log(`• weth.faucet(amount) - Get up to 10 WETH`);

    console.log("\n💡 Next Steps:");
    console.log("1. Save contract addresses to your .env file");
    console.log("2. Test faucet functions to get tokens");
    console.log("3. Test deposits with different tokens");
    console.log("4. Verify contracts on block explorer");
    console.log("5. Set up yield strategies");

    // Output environment variables for easy copying
    console.log("\n📝 Environment Variables (copy to .env file):");
    console.log("# " + "=".repeat(50));
    console.log(`${networkName.toUpperCase()}_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`${networkName.toUpperCase()}_USDC_ADDRESS=${tokens.usdc}`);
    console.log(`${networkName.toUpperCase()}_WBTC_ADDRESS=${tokens.wbtc}`);
    console.log(`${networkName.toUpperCase()}_WETH_ADDRESS=${tokens.weth}`);
    console.log("# " + "=".repeat(50));

    console.log("\n🚀 Deployment completed! Ready to use MultiTokenVault on " + networkName);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error("=".repeat(50));
        console.error(error);
        console.error("=".repeat(50));
        process.exit(1);
    }); 