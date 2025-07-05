import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Contract addresses from deployment
const USDFC_ADDRESS =
  process.env.USDFC_ADDRESS || "0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`🪙 Minting USDFC tokens on ${networkName.toUpperCase()}`);
  console.log(`📍 Recipient: ${deployer.address}`);
  console.log(`🪙 USDFC: ${USDFC_ADDRESS}`);

  try {
    // Get USDFC contract instance
    const usdfc = await ethers.getContractAt("IERC20", USDFC_ADDRESS);

    // Check if it's a mock token with mint function
    let isMockToken = false;
    try {
      // Try to get the contract as a mock token
      const mockUsdfc = await ethers.getContractAt("MockUSDC", USDFC_ADDRESS);
      isMockToken = true;

      console.log(`\n🔍 Checking current balance...`);
      const balanceBefore = await usdfc.balanceOf(deployer.address);
      console.log(
        `💳 USDFC Balance Before: ${ethers.formatUnits(balanceBefore, 6)} USDFC`
      );

      // Amount to mint (100 USDFC = 100 * 10^6 since USDFC has 6 decimals)
      const mintAmount = ethers.parseUnits("100", 6);

      console.log(`\n🔄 Minting 100 USDFC tokens...`);
      const mintTx = await mockUsdfc.mint(deployer.address, mintAmount);
      const receipt = await mintTx.wait();
      console.log(`✅ Mint successful! Transaction: ${receipt?.hash}`);

      // Check balance after minting
      const balanceAfter = await usdfc.balanceOf(deployer.address);
      console.log(`\n📊 Results:`);
      console.log(
        `💳 USDFC Balance After: ${ethers.formatUnits(balanceAfter, 6)} USDFC`
      );
      console.log(`🎯 Minted: ${ethers.formatUnits(mintAmount, 6)} USDFC`);

      console.log(`\n🎉 MINTING COMPLETED SUCCESSFULLY!`);
      console.log(`\n🔗 Next step: Run deposit script`);
      console.log(`  npm run deposit:filecoin`);
    } catch (error) {
      console.log(
        `ℹ️  This appears to be a real USDFC token, not a mock token.`
      );
      console.log(`💡 You'll need to get USDFC tokens from a faucet or DEX.`);

      // Just check current balance
      const balance = await usdfc.balanceOf(deployer.address);
      console.log(
        `💳 Current USDFC Balance: ${ethers.formatUnits(balance, 6)} USDFC`
      );
    }
  } catch (error) {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
