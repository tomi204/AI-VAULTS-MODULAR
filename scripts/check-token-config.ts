import { ethers } from "hardhat";

// Deployed contract addresses on Flow Testnet
const CONTRACTS = {
  MockUSDC: "0xAF28B48E48317109F885FEc05751f5422d850857",
  MockWBTC: "0x8fDE7A649c782c96e7f4D9D88490a7C5031F51a9",
  MockWETH: "0xF3B66dEF94Ab0C8D485e36845f068aFB48959A04",
  MultiTokenVault: "0x7C65F77a4EbEa3D56368A73A12234bB4384ACB28",
};

// Expected Pyth Price IDs
const EXPECTED_PRICE_IDS = {
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  USDC_USD:
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
};

async function main() {
  console.log("🔍 Checking Token Configuration in MultiTokenVault");
  console.log("=================================================\n");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Using account: ${deployer.address}\n`);

  // Get contract instances
  const mockUSDC = await ethers.getContractAt("MockUSDC", CONTRACTS.MockUSDC);
  const mockWBTC = await ethers.getContractAt("MockWBTC", CONTRACTS.MockWBTC);
  const mockWETH = await ethers.getContractAt("MockWETH", CONTRACTS.MockWETH);
  const vault = await ethers.getContractAt(
    "MultiTokenVault",
    CONTRACTS.MultiTokenVault
  );

  console.log("📋 Token Configuration Status:");
  console.log("==================================================");

  // Check USDC configuration
  console.log("\n💰 USDC Configuration:");
  const usdcConfig = await vault.acceptedTokens(CONTRACTS.MockUSDC);
  console.log(`   • Address: ${CONTRACTS.MockUSDC}`);
  console.log(`   • Is Accepted: ${usdcConfig.isAccepted ? "✅" : "❌"}`);
  console.log(`   • Price ID: ${usdcConfig.priceId}`);
  console.log(`   • Expected: 0x0 (no oracle needed for USDC)`);
  console.log(`   • Decimals: ${usdcConfig.decimals}`);
  console.log(
    `   • Status: ${
      usdcConfig.isAccepted &&
      usdcConfig.priceId ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? "✅ Correctly configured"
        : "⚠️ Check configuration"
    }`
  );

  // Check WBTC configuration
  console.log("\n🪙 WBTC Configuration:");
  const wbtcConfig = await vault.acceptedTokens(CONTRACTS.MockWBTC);
  console.log(`   • Address: ${CONTRACTS.MockWBTC}`);
  console.log(`   • Is Accepted: ${wbtcConfig.isAccepted ? "✅" : "❌"}`);
  console.log(`   • Price ID: ${wbtcConfig.priceId}`);
  console.log(`   • Expected: ${EXPECTED_PRICE_IDS.BTC_USD}`);
  console.log(`   • Decimals: ${wbtcConfig.decimals}`);
  console.log(
    `   • Status: ${
      wbtcConfig.isAccepted && wbtcConfig.priceId === EXPECTED_PRICE_IDS.BTC_USD
        ? "✅ Correctly configured"
        : "⚠️ Check configuration"
    }`
  );

  // Check WETH configuration
  console.log("\n💎 WETH Configuration:");
  const wethConfig = await vault.acceptedTokens(CONTRACTS.MockWETH);
  console.log(`   • Address: ${CONTRACTS.MockWETH}`);
  console.log(`   • Is Accepted: ${wethConfig.isAccepted ? "✅" : "❌"}`);
  console.log(`   • Price ID: ${wethConfig.priceId}`);
  console.log(`   • Expected: ${EXPECTED_PRICE_IDS.ETH_USD}`);
  console.log(`   • Decimals: ${wethConfig.decimals}`);
  console.log(
    `   • Status: ${
      wethConfig.isAccepted && wethConfig.priceId === EXPECTED_PRICE_IDS.ETH_USD
        ? "✅ Correctly configured"
        : "⚠️ Check configuration"
    }`
  );

  // Check all accepted tokens
  console.log("\n📝 All Accepted Tokens:");
  const acceptedTokens = await vault.getAcceptedTokens();
  console.log(`   • Total accepted tokens: ${acceptedTokens.length}`);
  for (let i = 0; i < acceptedTokens.length; i++) {
    console.log(`   • Token ${i + 1}: ${acceptedTokens[i]}`);
  }

  // Test if we can get price data (this is where the issue might be)
  console.log("\n🔮 Testing Pyth Oracle Access:");
  try {
    // Test WBTC price preview (this uses the oracle)
    const testAmount = ethers.parseUnits("0.01", 8); // 0.01 WBTC
    console.log(
      `   • Testing WBTC preview for ${ethers.formatUnits(
        testAmount,
        8
      )} WBTC...`
    );

    const previewValue = await vault.previewTokenDeposit(
      CONTRACTS.MockWBTC,
      testAmount
    );
    console.log(
      `   • ✅ Oracle working! Preview: ${ethers.formatUnits(
        previewValue,
        6
      )} USDC`
    );
  } catch (error: any) {
    console.log(`   • ❌ Oracle failed: ${error.message}`);
    console.log(
      `   • This suggests the Pyth oracle on Flow Testnet has stale data`
    );
  }

  // Test WETH preview too
  try {
    const testAmountETH = ethers.parseUnits("0.1", 18); // 0.1 WETH
    console.log(
      `   • Testing WETH preview for ${ethers.formatUnits(
        testAmountETH,
        18
      )} WETH...`
    );

    const previewValueETH = await vault.previewTokenDeposit(
      CONTRACTS.MockWETH,
      testAmountETH
    );
    console.log(
      `   • ✅ ETH Oracle working! Preview: ${ethers.formatUnits(
        previewValueETH,
        6
      )} USDC`
    );
  } catch (error: any) {
    console.log(`   • ❌ ETH Oracle failed: ${error.message}`);
  }

  // Summary
  console.log("\n📊 Configuration Summary:");
  const allConfigured =
    usdcConfig.isAccepted && wbtcConfig.isAccepted && wethConfig.isAccepted;
  const priceIdsCorrect =
    wbtcConfig.priceId === EXPECTED_PRICE_IDS.BTC_USD &&
    wethConfig.priceId === EXPECTED_PRICE_IDS.ETH_USD;

  console.log(`   • All tokens configured: ${allConfigured ? "✅" : "❌"}`);
  console.log(`   • Price IDs correct: ${priceIdsCorrect ? "✅" : "❌"}`);
  console.log(
    `   • Oracle functionality: ${
      priceIdsCorrect ? "Depends on Pyth data freshness" : "Check configuration"
    }`
  );

  if (allConfigured && priceIdsCorrect) {
    console.log("\n✅ Configuration is correct!");
    console.log("   The issue with WBTC/WETH deposits is likely due to:");
    console.log("   • Stale price data on Pyth Network (>25 minutes old)");
    console.log("   • Infrequent price updates on Flow Testnet");
    console.log(
      "   • Pyth Network might not be actively maintained on testnet"
    );
  } else {
    console.log("\n⚠️  Configuration issues detected!");
    console.log("   Please check the token configurations above.");
  }

  console.log("\n✨ Configuration check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
