import { ethers } from "hardhat";

// Deployed contract addresses on Flow Testnet
const CONTRACTS = {
    MockWBTC: "0x8fDE7A649c782c96e7f4D9D88490a7C5031F51a9", 
    MultiTokenVault: "0x7C65F77a4EbEa3D56368A73A12234bB4384ACB28"
};

async function main() {
    console.log("💎 Attempting WBTC Deposit to MultiTokenVault");
    console.log("=============================================\n");

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Using account: ${deployer.address}\n`);

    // Get contract instances
    const mockWBTC = await ethers.getContractAt("MockWBTC", CONTRACTS.MockWBTC);
    const vault = await ethers.getContractAt("MultiTokenVault", CONTRACTS.MultiTokenVault);

    // Check current balances
    const wbtcBalance = await mockWBTC.balanceOf(deployer.address);
    const vaultShares = await vault.balanceOf(deployer.address);
    
    console.log("📊 Current Balances:");
    console.log(`   WBTC: ${ethers.formatUnits(wbtcBalance, 8)} WBTC`);
    console.log(`   Vault Shares: ${ethers.formatEther(vaultShares)} mtvUSDC\n`);

    // Check if WBTC is configured in the vault
    console.log("🔍 Checking WBTC configuration in vault...");
    const tokenConfig = await vault.acceptedTokens(CONTRACTS.MockWBTC);
    console.log(`   Is Accepted: ${tokenConfig.isAccepted}`);
    console.log(`   Price ID: ${tokenConfig.priceId}`);
    console.log(`   Decimals: ${tokenConfig.decimals}\n`);

    if (!tokenConfig.isAccepted) {
        console.log("❌ WBTC is not configured as accepted token!");
        return;
    }

    // Attempt WBTC deposit with smaller amount
    const wbtcDepositAmount = ethers.parseUnits("0.01", 8); // 0.01 WBTC
    
    console.log(`💎 Attempting to deposit ${ethers.formatUnits(wbtcDepositAmount, 8)} WBTC...\n`);

    // Get more WBTC if needed
    if (wbtcBalance < wbtcDepositAmount) {
        console.log("🚿 Getting more WBTC from faucet...");
        const faucetAmount = ethers.parseUnits("1", 8); // 1 WBTC
        const faucetTx = await mockWBTC.faucet(faucetAmount);
        await faucetTx.wait();
        console.log("✅ Got WBTC from faucet\n");
    }

    try {
        // First, let's try to preview the deposit to check oracle
        console.log("🔍 Previewing WBTC deposit (testing oracle)...");
        const previewValue = await vault.previewTokenDeposit(CONTRACTS.MockWBTC, wbtcDepositAmount);
        console.log(`   ✅ Oracle working! Expected USDC equivalent: ${ethers.formatUnits(previewValue, 6)} USDC\n`);

        // Approve vault to spend WBTC
        console.log("✅ Approving WBTC...");
        const approveTx = await mockWBTC.approve(CONTRACTS.MultiTokenVault, wbtcDepositAmount);
        await approveTx.wait();

        // Deposit WBTC
        console.log("✅ Depositing WBTC...");
        const depositTx = await vault.depositToken(CONTRACTS.MockWBTC, wbtcDepositAmount, deployer.address);
        const receipt = await depositTx.wait();
        
        console.log(`✅ Transaction successful! Hash: ${receipt?.hash}\n`);

        // Find the MultiTokenDeposit event
        if (receipt) {
            const depositEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = vault.interface.parseLog(log);
                    return parsed?.name === 'MultiTokenDeposit';
                } catch {
                    return false;
                }
            });

            if (depositEvent) {
                const parsed = vault.interface.parseLog(depositEvent);
                if (parsed) {
                    console.log("🎉 WBTC Deposit successful!");
                    console.log(`   Token: ${parsed.args.token}`);
                    console.log(`   Amount: ${ethers.formatUnits(parsed.args.tokenAmount, 8)} WBTC`);
                    console.log(`   USDC Equivalent: ${ethers.formatUnits(parsed.args.usdcEquivalent, 6)} USDC`);
                    console.log(`   Shares Minted: ${ethers.formatEther(parsed.args.shares)} mtvUSDC\n`);
                }
            }
        }

        // Check final balances
        const finalWbtcBalance = await mockWBTC.balanceOf(deployer.address);
        const finalVaultShares = await vault.balanceOf(deployer.address);
        const totalAssets = await vault.totalAssets();

        console.log("📊 Final Balances:");
        console.log(`   WBTC: ${ethers.formatUnits(finalWbtcBalance, 8)} WBTC`);
        console.log(`   Vault Shares: ${ethers.formatEther(finalVaultShares)} mtvUSDC`);
        console.log(`   Vault Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);

    } catch (error: any) {
        console.log("❌ WBTC deposit failed:");
        console.log(`   Error: ${error.message}\n`);
        
        // Try to provide helpful information
        console.log("🔍 Possible reasons for failure:");
        console.log("   1. Oracle price data is too old (>25 minutes)");
        console.log("   2. Pyth Network might not be updating prices on Flow Testnet frequently");
        console.log("   3. Price feed might be negative or zero");
        console.log("   4. Network congestion or gas issues");
        
        console.log("\n💡 Suggestions:");
        console.log("   - Try again in a few minutes when oracle updates");
        console.log("   - Consider using USDC deposits instead (no oracle needed)");
        console.log("   - Check Pyth Network status for Flow Testnet");
    }

    console.log("\n✨ WBTC deposit attempt completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 