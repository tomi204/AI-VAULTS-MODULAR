import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Get configuration from environment variables
    const config = {
        usdc: process.env.USDC_ADDRESS || "0xa0b86a33E6441EeA8D9e08ec38a9c87C16fC77c4", // Default for testing (corrected checksum)
        pyth: process.env.PYTH_ADDRESS || "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", // Default Ethereum mainnet
        btcToken: process.env.BTC_TOKEN_ADDRESS, // e.g., WBTC address
        ethToken: process.env.ETH_TOKEN_ADDRESS, // e.g., WETH address
    };

    // Price IDs
    const PRICE_IDS = {
        BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
        ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    };

    // Validate required environment variables
    if (!process.env.PYTH_ADDRESS) {
        console.warn("⚠️  PYTH_ADDRESS not set, using default Ethereum mainnet address");
    }
    
    if (!config.btcToken) {
        console.warn("⚠️  BTC_TOKEN_ADDRESS not set, BTC token will not be configured");
    }
    
    if (!config.ethToken) {
        console.warn("⚠️  ETH_TOKEN_ADDRESS not set, ETH token will not be configured");
    }

    console.log("\n=== Configuration ===");
    console.log(`USDC: ${config.usdc}`);
    console.log(`Pyth: ${config.pyth}`);
    console.log(`BTC Token: ${config.btcToken || 'Not configured'}`);
    console.log(`ETH Token: ${config.ethToken || 'Not configured'}`);

    // Deploy MultiTokenVault
    const MultiTokenVault = await ethers.getContractFactory("MultiTokenVault");
    
    const manager = deployer.address; // For demo, same as deployer
    const agent = deployer.address;   // For demo, same as deployer
    
    console.log("\n=== Deploying MultiTokenVault ===");
    const vault = await MultiTokenVault.deploy(
        config.usdc,  // USDC address (underlying asset)
        manager,      // Manager address
        agent,        // Agent address
        config.pyth,  // Pyth contract address
        "Multi-Token Vault", // Vault name
        "mtvUSDC"     // Vault symbol
    );

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    
    console.log(`✅ MultiTokenVault deployed to: ${vaultAddress}`);

    // Configure accepted tokens
    console.log("\n=== Configuring Accepted Tokens ===");
    
    // USDC (no oracle needed, 1:1 conversion)
    console.log("Configuring USDC...");
    await vault.configureToken(config.usdc, ethers.ZeroHash, 6);
    console.log("✅ USDC configured (1:1, no oracle)");

    // BTC Token (if provided)
    if (config.btcToken) {
        console.log("Configuring BTC token...");
        try {
            await vault.configureToken(config.btcToken, PRICE_IDS.BTC, 8);
            console.log(`✅ BTC token configured: ${config.btcToken}`);
        } catch (error) {
            console.error(`❌ Failed to configure BTC token: ${error}`);
        }
    }

    // ETH Token (if provided) 
    if (config.ethToken) {
        console.log("Configuring ETH token...");
        try {
            await vault.configureToken(config.ethToken, PRICE_IDS.ETH, 18);
            console.log(`✅ ETH token configured: ${config.ethToken}`);
        } catch (error) {
            console.error(`❌ Failed to configure ETH token: ${error}`);
        }
    }

    console.log("\n=== Deployment Summary ===");
    console.log(`🏦 MultiTokenVault: ${vaultAddress}`);
    console.log(`💰 Underlying Asset: USDC (${config.usdc})`);
    console.log(`🔮 Oracle: Pyth (${config.pyth})`);
    console.log(`👨‍💼 Manager: ${manager}`);
    console.log(`🤖 Agent: ${agent}`);
    
    console.log("\n=== Accepted Tokens ===");
    console.log(`• USDC: ${config.usdc} (1:1 conversion, no oracle)`);
    if (config.btcToken) {
        console.log(`• BTC: ${config.btcToken} (Pyth oracle: ${PRICE_IDS.BTC.slice(0, 10)}...)`);
    }
    if (config.ethToken) {
        console.log(`• ETH: ${config.ethToken} (Pyth oracle: ${PRICE_IDS.ETH.slice(0, 10)}...)`);
    }

    console.log("\n=== Usage ===");
    console.log("Users can:");
    console.log("• Deposit USDC → 1:1 conversion to vault shares");
    if (config.btcToken || config.ethToken) {
        console.log("• Deposit BTC/ETH tokens → Pyth oracle conversion to USDC equivalent shares");
    }
    console.log("• Withdraw only USDC (ERC4626 standard)");
    console.log("• Earn yield through strategy execution");

    console.log("\n=== Environment Variables Used ===");
    console.log("USDC_ADDRESS:", process.env.USDC_ADDRESS || "Not set (using default)");
    console.log("PYTH_ADDRESS:", process.env.PYTH_ADDRESS || "Not set (using default)");
    console.log("BTC_TOKEN_ADDRESS:", process.env.BTC_TOKEN_ADDRESS || "Not set");
    console.log("ETH_TOKEN_ADDRESS:", process.env.ETH_TOKEN_ADDRESS || "Not set");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 