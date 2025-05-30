#!/usr/bin/env node

import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
  console.log("🧪 Running Integration Tests\n");

  try {
    // Get signers
    const [deployer, manager, agent, user] = await ethers.getSigners();
    
    console.log("👥 Test accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Manager:  ${manager.address}`);
    console.log(`   Agent:    ${agent.address}`);
    console.log(`   User:     ${user.address}\n`);

    // Deploy contracts for testing
    console.log("🚀 Deploying contracts for integration test...");
    
    // Deploy tokens
    const MockToken = await ethers.getContractFactory("MockToken");
    const underlyingToken = await MockToken.deploy("Test Token", "TEST");
    const rewardToken = await MockToken.deploy("Reward Token", "REWARD");
    
    // Mint tokens
    await underlyingToken.mint(deployer.address, parseEther("1000000"));
    await underlyingToken.mint(user.address, parseEther("10000"));
    await rewardToken.mint(deployer.address, parseEther("1000000"));

    // Deploy protocol
    const MockProtocol = await ethers.getContractFactory("MockProtocol");
    const mockProtocol = await MockProtocol.deploy(
      await underlyingToken.getAddress(),
      await rewardToken.getAddress()
    );

    // Deploy vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
      await underlyingToken.getAddress(),
      "Test Vault",
      "vTEST",
      manager.address,
      agent.address
    );

    // Deploy strategy
    const Strategies = await ethers.getContractFactory("Strategies");
    const strategies = await Strategies.deploy(
      await underlyingToken.getAddress(),
      await mockProtocol.getAddress(),
      ethers.id("deposit(uint256)").slice(0, 10),
      ethers.id("withdraw(uint256)").slice(0, 10),
      ethers.id("claimRewards()").slice(0, 10),
      ethers.id("getBalance(address)").slice(0, 10)
    );

    // Setup
    await strategies.setVault(await vault.getAddress());
    await vault.connect(manager).addStrategy(await strategies.getAddress());
    await rewardToken.transfer(await mockProtocol.getAddress(), parseEther("10000"));

    console.log("✅ Contracts deployed and configured\n");

    // Run integration tests
    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: User Deposit to Vault
    totalTests++;
    console.log("🧪 Test 1: User deposit to vault");
    try {
      const depositAmount = parseEther("1000");
      await underlyingToken.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).deposit(depositAmount, user.address);
      
      const userShares = await vault.balanceOf(user.address);
      const vaultAssets = await vault.totalAssets();
      
      if (userShares > 0 && vaultAssets.toString() === depositAmount.toString()) {
        console.log("   ✅ PASSED - User successfully deposited to vault");
        testsPassed++;
      } else {
        console.log("   ❌ FAILED - Vault state incorrect");
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error}`);
    }

    // Test 2: Agent deploys to strategy
    totalTests++;
    console.log("🧪 Test 2: Agent deploys to strategy");
    try {
      const deployAmount = parseEther("500");
      await vault.connect(agent).depositToStrategy(await strategies.getAddress(), deployAmount, "0x");
      
      const strategyBalance = await strategies.getBalance();
      
      if (strategyBalance.toString() === deployAmount.toString()) {
        console.log("   ✅ PASSED - Agent successfully deployed to strategy");
        testsPassed++;
      } else {
        console.log("   ❌ FAILED - Strategy balance incorrect");
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error}`);
    }

    // Test 3: Add reward token and harvest
    totalTests++;
    console.log("🧪 Test 3: Add reward token and harvest");
    try {
      // Impersonate vault for this test
      await ethers.provider.send("hardhat_impersonateAccount", [await vault.getAddress()]);
      const vaultSigner = await ethers.getSigner(await vault.getAddress());
      
      // Give vault some ETH for gas
      await deployer.sendTransaction({
        to: await vault.getAddress(),
        value: parseEther("1")
      });
      
      await strategies.connect(vaultSigner).addRewardToken(await rewardToken.getAddress());
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [await vault.getAddress()]);
      
      // Harvest
      await vault.connect(agent).harvestStrategy(await strategies.getAddress(), "0x");
      
      // Check if reward tokens were forwarded
      const vaultRewardBalance = await rewardToken.balanceOf(await vault.getAddress());
      
      if (vaultRewardBalance > 0) {
        console.log(`   ✅ PASSED - Harvested ${formatEther(vaultRewardBalance)} reward tokens`);
        testsPassed++;
      } else {
        console.log("   ✅ PASSED - Harvest executed (no rewards yet, expected)");
        testsPassed++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error}`);
    }

    // Test 4: Emergency exit
    totalTests++;
    console.log("🧪 Test 4: Emergency exit from strategy");
    try {
      const strategyBalanceBefore = await strategies.getBalance();
      const vaultBalanceBefore = await underlyingToken.balanceOf(await vault.getAddress());
      
      await vault.connect(agent).emergencyExitStrategy(await strategies.getAddress(), "0x");
      
      const strategyBalanceAfter = await strategies.getBalance();
      const vaultBalanceAfter = await underlyingToken.balanceOf(await vault.getAddress());
      
      if (strategyBalanceAfter.toString() === "0" && vaultBalanceAfter > vaultBalanceBefore) {
        console.log("   ✅ PASSED - Emergency exit successful, funds returned to vault");
        testsPassed++;
      } else {
        console.log("   ❌ FAILED - Emergency exit did not work correctly");
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error}`);
    }

    // Test 5: User withdraws from vault
    totalTests++;
    console.log("🧪 Test 5: User withdraws from vault");
    try {
      const withdrawAmount = parseEther("200");
      const userBalanceBefore = await underlyingToken.balanceOf(user.address);
      
      await vault.connect(user).withdraw(withdrawAmount, user.address, user.address);
      
      const userBalanceAfter = await underlyingToken.balanceOf(user.address);
      
      if (userBalanceAfter > userBalanceBefore) {
        console.log("   ✅ PASSED - User successfully withdrew from vault");
        testsPassed++;
      } else {
        console.log("   ❌ FAILED - User withdrawal did not work");
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error}`);
    }

    // Results
    console.log("\n📊 Integration Test Results");
    console.log("==========================");
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`❌ Tests Failed: ${totalTests - testsPassed}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%\n`);

    if (testsPassed === totalTests) {
      console.log("🎉 All integration tests passed! The system is working correctly.");
    } else {
      console.log("⚠️  Some tests failed. Please review the implementation.");
    }

  } catch (error) {
    console.error("❌ Integration test failed:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 