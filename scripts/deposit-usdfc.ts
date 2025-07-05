import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Contract addresses from deployment
const VAULT_ADDRESS =
  process.env.FILECOIN_VAULT_ADDRESS ||
  "0xAF28B48E48317109F885FEc05751f5422d850857";
const USDFC_ADDRESS =
  process.env.USDFC_ADDRESS || "0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`💰 Depositing 1 USDFC to Vault on ${networkName.toUpperCase()}`);
  console.log(`📍 Depositor: ${deployer.address}`);
  console.log(`🏦 Vault: ${VAULT_ADDRESS}`);
  console.log(`🪙 USDFC: ${USDFC_ADDRESS}`);

  try {
    // Get contract instances
    const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS);
    const usdfc = await ethers.getContractAt("IERC20", USDFC_ADDRESS);

    // Amount to deposit (1 USDFC = 1 * 10^6 since USDFC has 6 decimals)
    const depositAmount = ethers.parseUnits("1", 6);

    console.log(`\n🔍 Checking current balances...`);

    // Check USDFC balance
    const usdfcBalance = await usdfc.balanceOf(deployer.address);
    console.log(
      `💳 USDFC Balance: ${ethers.formatUnits(usdfcBalance, 6)} USDFC`
    );

    if (usdfcBalance < depositAmount) {
      console.log(
        `❌ Insufficient USDFC balance. Need 1 USDFC but have ${ethers.formatUnits(
          usdfcBalance,
          6
        )} USDFC`
      );
      process.exit(1);
    }

    // Check vault shares balance before deposit
    const sharesBefore = await vault.balanceOf(deployer.address);
    console.log(
      `📊 Vault Shares Before: ${ethers.formatEther(sharesBefore)} ShoUSD`
    );

    // Check vault total assets before deposit
    const totalAssetsBefore = await vault.totalAssets();
    console.log(
      `🏛️ Total Assets Before: ${ethers.formatUnits(
        totalAssetsBefore,
        6
      )} USDFC`
    );

    // Step 1: Approve USDFC spending
    console.log(`\n🔄 Approving USDFC spending...`);
    const approveTx = await usdfc.approve(VAULT_ADDRESS, depositAmount);
    await approveTx.wait();
    console.log(`✅ USDFC approved for spending`);

    // Step 2: Deposit USDFC to vault
    console.log(`🔄 Depositing 1 USDFC to vault...`);
    const depositTx = await vault.deposit(depositAmount, deployer.address);
    const receipt = await depositTx.wait();
    console.log(`✅ Deposit successful! Transaction: ${receipt?.hash}`);

    // Check balances after deposit
    console.log(`\n📊 Checking balances after deposit...`);

    const usdfcBalanceAfter = await usdfc.balanceOf(deployer.address);
    console.log(
      `💳 USDFC Balance After: ${ethers.formatUnits(
        usdfcBalanceAfter,
        6
      )} USDFC`
    );

    const sharesAfter = await vault.balanceOf(deployer.address);
    console.log(
      `📊 Vault Shares After: ${ethers.formatEther(sharesAfter)} ShoUSD`
    );

    const totalAssetsAfter = await vault.totalAssets();
    console.log(
      `🏛️ Total Assets After: ${ethers.formatUnits(totalAssetsAfter, 6)} USDFC`
    );

    // Calculate received shares
    const receivedShares = sharesAfter - sharesBefore;
    console.log(`\n🎯 Summary:`);
    console.log(`  Deposited: ${ethers.formatUnits(depositAmount, 6)} USDFC`);
    console.log(
      `  Received: ${ethers.formatEther(receivedShares)} ShoUSD shares`
    );
    console.log(
      `  Exchange Rate: 1 USDFC = ${ethers.formatEther(receivedShares)} ShoUSD`
    );

    // Check vault asset info
    const assetAddress = await vault.asset();
    console.log(`\n🔍 Vault Info:`);
    console.log(`  Asset: ${assetAddress}`);
    console.log(`  Name: ${await vault.name()}`);
    console.log(`  Symbol: ${await vault.symbol()}`);
    console.log(
      `  Total Supply: ${ethers.formatEther(await vault.totalSupply())} ShoUSD`
    );

    console.log(`\n🎉 DEPOSIT COMPLETED SUCCESSFULLY!`);
    console.log(`\n🔗 Monitor on explorers:`);
    console.log(`  - Beryx: https://beryx.zondax.ch/address/${VAULT_ADDRESS}`);
    console.log(
      `  - Filfox: https://calibration.filfox.info/en/address/${VAULT_ADDRESS}`
    );
  } catch (error) {
    console.error("❌ Deposit failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
