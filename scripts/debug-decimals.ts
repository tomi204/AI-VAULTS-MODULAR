import { ethers } from "hardhat";

// Deployed contract addresses on Flow Testnet
const CONTRACTS = {
    MockUSDC: "0xAF28B48E48317109F885FEc05751f5422d850857",
    MockWBTC: "0x8fDE7A649c782c96e7f4D9D88490a7C5031F51a9", 
    MockWETH: "0xF3B66dEF94Ab0C8D485e36845f068aFB48959A04",
    MultiTokenVault: "0x7C65F77a4EbEa3D56368A73A12234bB4384ACB28"
};

async function main() {
    console.log("🔍 Debugging Decimal Issues in MultiTokenVault");
    console.log("===============================================\n");

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Using account: ${deployer.address}\n`);

    // Get contract instances
    const mockUSDC = await ethers.getContractAt("MockUSDC", CONTRACTS.MockUSDC);
    const mockWBTC = await ethers.getContractAt("MockWBTC", CONTRACTS.MockWBTC);
    const mockWETH = await ethers.getContractAt("MockWETH", CONTRACTS.MockWETH);
    const vault = await ethers.getContractAt("MultiTokenVault", CONTRACTS.MultiTokenVault);

    // Check decimals of all tokens
    console.log("📐 Token Decimals Configuration:");
    const usdcDecimals = await mockUSDC.decimals();
    const wbtcDecimals = await mockWBTC.decimals();
    const wethDecimals = await mockWETH.decimals();
    const vaultDecimals = await vault.decimals();

    console.log(`   • MockUSDC: ${usdcDecimals} decimals`);
    console.log(`   • MockWBTC: ${wbtcDecimals} decimals`);
    console.log(`   • MockWETH: ${wethDecimals} decimals`);
    console.log(`   • Vault (mtvUSDC): ${vaultDecimals} decimals\n`);

    // Check current balances with correct formatting
    console.log("📊 Current Account Balances:");
    const usdcBalance = await mockUSDC.balanceOf(deployer.address);
    const wbtcBalance = await mockWBTC.balanceOf(deployer.address);
    const wethBalance = await mockWETH.balanceOf(deployer.address);
    const vaultShares = await vault.balanceOf(deployer.address);

    console.log(`   • USDC: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`);
    console.log(`   • WBTC: ${ethers.formatUnits(wbtcBalance, wbtcDecimals)} WBTC`);
    console.log(`   • WETH: ${ethers.formatUnits(wethBalance, wethDecimals)} WETH`);
    console.log(`   • Vault Shares: ${ethers.formatUnits(vaultShares, vaultDecimals)} mtvUSDC\n`);

    // Check vault state
    console.log("🏦 Vault State:");
    const totalAssets = await vault.totalAssets();
    const totalSupply = await vault.totalSupply();
    const vaultUsdcBalance = await mockUSDC.balanceOf(CONTRACTS.MultiTokenVault);

    console.log(`   • Total Assets: ${ethers.formatUnits(totalAssets, usdcDecimals)} USDC`);
    console.log(`   • Total Supply: ${ethers.formatUnits(totalSupply, vaultDecimals)} mtvUSDC`);
    console.log(`   • Vault USDC Balance: ${ethers.formatUnits(vaultUsdcBalance, usdcDecimals)} USDC\n`);

    // Verify vault integrity
    console.log("✅ Vault Integrity Check:");
    if (vaultUsdcBalance === totalAssets) {
        console.log(`   • Balance matches ✅ (${ethers.formatUnits(vaultUsdcBalance, usdcDecimals)} USDC)`);
    } else {
        console.log(`   • Balance mismatch ❌`);
        console.log(`     - Actual USDC: ${ethers.formatUnits(vaultUsdcBalance, usdcDecimals)}`);
        console.log(`     - Reported Assets: ${ethers.formatUnits(totalAssets, usdcDecimals)}`);
    }

    // Calculate exchange rate
    if (totalSupply > 0n) {
        const totalAssetsNum = Number(ethers.formatUnits(totalAssets, usdcDecimals));
        const totalSupplyNum = Number(ethers.formatUnits(totalSupply, vaultDecimals));
        const exchangeRate = totalAssetsNum / totalSupplyNum;
        console.log(`   • Exchange Rate: 1 mtvUSDC = ${exchangeRate.toFixed(6)} USDC ${exchangeRate === 1 ? '✅' : '⚠️'}`);
    } else {
        console.log(`   • No shares minted yet`);
    }
    console.log();

    // Test preview functions
    console.log("🧮 Preview Functions Test:");
    const testAmount = ethers.parseUnits("1000", usdcDecimals); // 1000 USDC
    
    try {
        const previewShares = await vault.previewDeposit(testAmount);
        const previewAssets = await vault.previewRedeem(previewShares);
        
        console.log(`   • Deposit 1,000 USDC → ${ethers.formatUnits(previewShares, vaultDecimals)} mtvUSDC`);
        console.log(`   • Redeem those shares → ${ethers.formatUnits(previewAssets, usdcDecimals)} USDC`);
        
        const isCorrect = Math.abs(Number(ethers.formatUnits(previewShares, vaultDecimals)) - 1000) < 0.001 &&
                         Math.abs(Number(ethers.formatUnits(previewAssets, usdcDecimals)) - 1000) < 0.001;
        
        console.log(`   • Preview functions working: ${isCorrect ? '✅' : '❌'}\n`);
    } catch (error: any) {
        console.log(`   • Preview failed ❌: ${error.message}\n`);
    }

    // Raw values for debugging
    console.log("🔍 Raw Values (for debugging):");
    console.log(`   • USDC Balance: ${usdcBalance.toString()}`);
    console.log(`   • Vault Shares: ${vaultShares.toString()}`);
    console.log(`   • Total Assets: ${totalAssets.toString()}`);
    console.log(`   • Total Supply: ${totalSupply.toString()}\n`);

    // Summary
    console.log("📋 Summary:");
    if (totalSupply > 0n) {
        const userSharesFormatted = ethers.formatUnits(vaultShares, vaultDecimals);
        const totalAssetsFormatted = ethers.formatUnits(totalAssets, usdcDecimals);
        console.log(`   • You have deposited: ${totalAssetsFormatted} USDC`);
        console.log(`   • You received: ${userSharesFormatted} mtvUSDC shares`);
        console.log(`   • Ratio: ${Number(userSharesFormatted) / Number(totalAssetsFormatted) === 1 ? '1:1 ✅' : 'Not 1:1 ⚠️'}`);
    } else {
        console.log(`   • No deposits made yet`);
    }

    console.log("\n✨ Debug completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 