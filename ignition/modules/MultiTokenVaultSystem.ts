import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Price IDs (universal across all networks)
const PRICE_IDS = {
    BTC: process.env.BTC_USD_PRICE_ID || "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    ETH: process.env.ETH_USD_PRICE_ID || "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    USDC: process.env.USDC_USD_PRICE_ID || "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
};

const MultiTokenVaultSystem = buildModule("MultiTokenVaultSystem", (m) => {
    // Get Pyth address from parameters (will be set in parameters file)
    const pythAddress = m.getParameter("pythAddress");

    // Get deployer account - will be used as default for manager/agent
    const deployer = m.getAccount(0);

    console.log(`\n🚀 Deploying MultiTokenVault System`);
    console.log(`🔮 Using Pyth Oracle: ${pythAddress}`);
    console.log(`👤 Using deployer as Manager and Agent: ${deployer}`);

    // Deploy Mock Tokens
    console.log("\n=== Deploying Mock Tokens ===");

    const mockUSDC = m.contract("MockUSDC", []);
    console.log("🪙 MockUSDC deployment initiated");

    const mockWBTC = m.contract("MockWBTC", []);
    console.log("🪙 MockWBTC deployment initiated");

    const mockWETH = m.contract("MockWETH", []);
    console.log("🪙 MockWETH deployment initiated");

    // Deploy MultiTokenVault
    console.log("\n=== Deploying MultiTokenVault ===");

    const multiTokenVault = m.contract("MultiTokenVault", [
        mockUSDC,          // USDC address (underlying asset)
        deployer,          // Manager address (deployer)
        deployer,          // Agent address (deployer)
        pythAddress,       // Pyth contract address
        "Multi-Token Vault", // Vault name
        "mtvUSDC"          // Vault symbol
    ]);

    console.log("🏦 MultiTokenVault deployment initiated");

    // Configure accepted tokens
    console.log("\n=== Configuring Accepted Tokens ===");

    // USDC (no oracle needed, 1:1 conversion)
    m.call(multiTokenVault, "configureToken", [mockUSDC, "0x0000000000000000000000000000000000000000000000000000000000000000", 6], {
        id: "configure_usdc"
    });
    console.log("⚙️  USDC configuration initiated");

    // WBTC (with BTC/USD price feed)
    m.call(multiTokenVault, "configureToken", [mockWBTC, PRICE_IDS.BTC, 8], {
        id: "configure_wbtc"
    });
    console.log("⚙️  WBTC configuration initiated");

    // WETH (with ETH/USD price feed)
    m.call(multiTokenVault, "configureToken", [mockWETH, PRICE_IDS.ETH, 18], {
        id: "configure_weth"
    });
    console.log("⚙️  WETH configuration initiated");

    return {
        mockUSDC,
        mockWBTC,
        mockWETH,
        multiTokenVault
    };
});

export default MultiTokenVaultSystem; 