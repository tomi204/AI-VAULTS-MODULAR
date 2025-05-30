import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MultiTokenVault, MockToken } from "../typechain-types";

describe("MultiTokenVault", function () {
    let vault: MultiTokenVault;
    let usdc: MockToken;
    let weth: MockToken;
    let wbtc: MockToken;
    let owner: SignerWithAddress;
    let manager: SignerWithAddress;
    let agent: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;

    // Real Pyth address for testing (on mainnet fork or testnet)
    const PYTH_ADDRESS = "0x4305FB66699C3B2702D4d05CF36551390A4c69C6";
    
    // Real Pyth price IDs
    const ETH_PRICE_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
    const BTC_PRICE_ID = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

    const INITIAL_BALANCE = ethers.parseEther("1000");

    beforeEach(async function () {
        // Get signers
        [owner, manager, agent, alice, bob] = await ethers.getSigners();

        // Deploy mock tokens using existing MockToken contract
        const MockTokenFactory = await ethers.getContractFactory("MockToken");
        usdc = await MockTokenFactory.deploy("USD Coin", "USDC");
        weth = await MockTokenFactory.deploy("Wrapped Ether", "WETH");
        wbtc = await MockTokenFactory.deploy("Wrapped Bitcoin", "WBTC");

        // Deploy MultiTokenVault
        const MultiTokenVaultFactory = await ethers.getContractFactory("MultiTokenVault");
        vault = await MultiTokenVaultFactory.deploy(
            await usdc.getAddress(),
            manager.address,
            agent.address,
            PYTH_ADDRESS,
            "Multi-Token Vault",
            "mtvUSDC"
        );

        // Setup test accounts with tokens
        await usdc.transfer(alice.address, INITIAL_BALANCE);
        await usdc.transfer(bob.address, INITIAL_BALANCE);
        await weth.transfer(alice.address, INITIAL_BALANCE);
        await weth.transfer(bob.address, INITIAL_BALANCE);
        await wbtc.transfer(alice.address, ethers.parseUnits("10", 8)); // WBTC has 8 decimals
        await wbtc.transfer(bob.address, ethers.parseUnits("10", 8));

        // Configure accepted tokens
        // USDC (no oracle needed, 1:1)
        await vault.connect(manager).configureToken(await usdc.getAddress(), ethers.ZeroHash, 18);
        // WETH (needs oracle)
        await vault.connect(manager).configureToken(await weth.getAddress(), ETH_PRICE_ID, 18);
        // WBTC (needs oracle)
        await vault.connect(manager).configureToken(await wbtc.getAddress(), BTC_PRICE_ID, 8);
    });

    describe("Constructor and Roles", function () {
        it("Should set the correct asset (USDC)", async function () {
            expect(await vault.asset()).to.equal(await usdc.getAddress());
        });

        it("Should set the correct name and symbol", async function () {
            expect(await vault.name()).to.equal("Multi-Token Vault");
            expect(await vault.symbol()).to.equal("mtvUSDC");
        });

        it("Should grant roles correctly", async function () {
            const DEFAULT_ADMIN_ROLE = await vault.DEFAULT_ADMIN_ROLE();
            const MANAGER_ROLE = await vault.MANAGER_ROLE();
            const AGENT_ROLE = await vault.AGENT_ROLE();

            expect(await vault.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
            expect(await vault.hasRole(MANAGER_ROLE, manager.address)).to.be.true;
            expect(await vault.hasRole(AGENT_ROLE, agent.address)).to.be.true;
        });

        it("Should expose role checking functions", async function () {
            expect(await vault.hasManagerRole(manager.address)).to.be.true;
            expect(await vault.hasAgentRole(agent.address)).to.be.true;
            expect(await vault.hasManagerRole(alice.address)).to.be.false;
            expect(await vault.hasAgentRole(alice.address)).to.be.false;
        });
    });

    describe("Token Configuration", function () {
        it("Should configure accepted tokens successfully", async function () {
            const wethConfig = await vault.acceptedTokens(await weth.getAddress());
            expect(wethConfig.isAccepted).to.be.true;
            expect(wethConfig.priceId).to.equal(ETH_PRICE_ID);
            expect(wethConfig.decimals).to.equal(18);
        });

        it("Should configure USDC without priceId", async function () {
            const usdcConfig = await vault.acceptedTokens(await usdc.getAddress());
            expect(usdcConfig.isAccepted).to.be.true;
            expect(usdcConfig.priceId).to.equal(ethers.ZeroHash);
            expect(usdcConfig.decimals).to.equal(18);
        });

        it("Should revert if not manager", async function () {
            await expect(
                vault.connect(alice).configureToken(alice.address, ETH_PRICE_ID, 18)
            ).to.be.revertedWith("MultiTokenVault: caller is not a manager");
        });

        it("Should revert on address(0)", async function () {
            await expect(
                vault.connect(manager).configureToken(ethers.ZeroAddress, ETH_PRICE_ID, 18)
            ).to.be.revertedWithCustomError(vault, "InvalidAddress");
        });

        it("Should remove tokens successfully", async function () {
            await vault.connect(manager).removeToken(await weth.getAddress());
            
            const config = await vault.acceptedTokens(await weth.getAddress());
            expect(config.isAccepted).to.be.false;
        });

        it("Should get accepted tokens list", async function () {
            const tokens = await vault.getAcceptedTokens();
            expect(tokens.length).to.be.greaterThan(0);
            expect(tokens).to.include(await usdc.getAddress());
            expect(tokens).to.include(await weth.getAddress());
        });
    });

    describe("USDC Deposits (No Oracle)", function () {
        beforeEach(async function () {
            // Approve vault to spend USDC tokens
            await usdc.connect(alice).approve(await vault.getAddress(), INITIAL_BALANCE);
            await usdc.connect(bob).approve(await vault.getAddress(), INITIAL_BALANCE);
        });

        it("Should deposit USDC directly (1:1)", async function () {
            const depositAmount = ethers.parseEther("100"); // MockToken has 18 decimals
            
            const sharesBefore = await vault.balanceOf(alice.address);
            const totalAssetsBefore = await vault.totalAssets();
            
            await vault.connect(alice).depositToken(await usdc.getAddress(), depositAmount, alice.address);
            
            const sharesAfter = await vault.balanceOf(alice.address);
            const totalAssetsAfter = await vault.totalAssets();

            // For first deposit in empty vault, shares should equal assets (1:1)
            if (totalAssetsBefore === 0n) {
                expect(sharesAfter).to.equal(depositAmount);
            } else {
                expect(sharesAfter - sharesBefore).to.be.gt(0);
            }
            
            expect(await usdc.balanceOf(alice.address)).to.equal(INITIAL_BALANCE - depositAmount);
            expect(totalAssetsAfter).to.equal(totalAssetsBefore + depositAmount);
        });

        it("Should handle multiple USDC deposits", async function () {
            const depositAmount = ethers.parseEther("50");
            
            await vault.connect(alice).depositToken(await usdc.getAddress(), depositAmount, alice.address);
            await vault.connect(bob).depositToken(await usdc.getAddress(), depositAmount, bob.address);

            expect(await vault.totalAssets()).to.equal(depositAmount * 2n);
        });

        it("Should preview USDC deposits correctly (1:1)", async function () {
            const depositAmount = ethers.parseEther("100");
            const preview = await vault.previewTokenDeposit(await usdc.getAddress(), depositAmount);
            expect(preview).to.equal(depositAmount); // 1:1 for USDC
        });
    });

    describe("ERC4626 Functions (Standard USDC)", function () {
        beforeEach(async function () {
            await usdc.connect(alice).approve(await vault.getAddress(), INITIAL_BALANCE);
            await usdc.connect(bob).approve(await vault.getAddress(), INITIAL_BALANCE);
        });

        it("Should work with standard ERC4626 deposit", async function () {
            const depositAmount = ethers.parseEther("100");
            
            const sharesBefore = await vault.balanceOf(alice.address);
            await vault.connect(alice).deposit(depositAmount, alice.address);
            const sharesAfter = await vault.balanceOf(alice.address);

            expect(sharesAfter - sharesBefore).to.be.gt(0);
            expect(await vault.totalAssets()).to.equal(depositAmount);
        });

        it("Should withdraw USDC successfully", async function () {
            const depositAmount = ethers.parseEther("100");
            await vault.connect(alice).deposit(depositAmount, alice.address);
            
            const withdrawAmount = ethers.parseEther("50");
            const sharesBefore = await vault.balanceOf(alice.address);
            await vault.connect(alice).withdraw(withdrawAmount, alice.address, alice.address);
            const sharesAfter = await vault.balanceOf(alice.address);

            expect(sharesBefore - sharesAfter).to.be.gt(0);
        });
    });

    describe("Multi-Token Deposits (Will fail without real oracle)", function () {
        beforeEach(async function () {
            await weth.connect(alice).approve(await vault.getAddress(), INITIAL_BALANCE);
            await wbtc.connect(alice).approve(await vault.getAddress(), ethers.parseUnits("10", 8));
        });

        it("Should revert WETH deposit (oracle will fail)", async function () {
            const depositAmount = ethers.parseEther("1");
            
            // This will revert because Pyth oracle call will fail without real oracle
            await expect(
                vault.connect(alice).depositToken(await weth.getAddress(), depositAmount, alice.address)
            ).to.be.reverted;
        });

        it("Should revert WBTC deposit (oracle will fail)", async function () {
            const depositAmount = ethers.parseUnits("1", 8);
            
            // This will revert because Pyth oracle call will fail without real oracle
            await expect(
                vault.connect(alice).depositToken(await wbtc.getAddress(), depositAmount, alice.address)
            ).to.be.reverted;
        });

        it("Should revert on non-accepted tokens", async function () {
            const MockTokenFactory = await ethers.getContractFactory("MockToken");
            const randomToken = await MockTokenFactory.deploy("Random", "RND");
            
            await expect(
                vault.connect(alice).depositToken(await randomToken.getAddress(), 100, alice.address)
            ).to.be.revertedWithCustomError(vault, "TokenNotAccepted");
        });

        it("Should revert on zero amounts", async function () {
            await expect(
                vault.connect(alice).depositToken(await weth.getAddress(), 0, alice.address)
            ).to.be.revertedWithCustomError(vault, "InvalidAmount");
        });

        it("Should revert on address(0) deposits", async function () {
            await expect(
                vault.connect(alice).depositToken(ethers.ZeroAddress, 100, alice.address)
            ).to.be.revertedWithCustomError(vault, "TokenNotAccepted");
        });
    });

    describe("Strategy Management", function () {
        let mockStrategy: SignerWithAddress;

        beforeEach(async function () {
            mockStrategy = alice; // Using alice's address as a mock strategy
        });

        describe("Add Strategy", function () {
            it("Should add strategy successfully", async function () {
                await expect(vault.connect(manager).addStrategy(mockStrategy.address))
                    .to.emit(vault, "StrategyAdded")
                    .withArgs(mockStrategy.address);

                expect(await vault.isStrategy(mockStrategy.address)).to.be.true;
            });

            it("Should revert if not manager", async function () {
                await expect(vault.connect(alice).addStrategy(mockStrategy.address))
                    .to.be.revertedWith("MultiTokenVault: caller is not a manager");
            });

            it("Should revert with zero address", async function () {
                await expect(vault.connect(manager).addStrategy(ethers.ZeroAddress))
                    .to.be.revertedWithCustomError(vault, "InvalidAddress");
            });

            it("Should revert if strategy already exists", async function () {
                await vault.connect(manager).addStrategy(mockStrategy.address);
                
                await expect(vault.connect(manager).addStrategy(mockStrategy.address))
                    .to.be.revertedWithCustomError(vault, "StrategyAlreadyExists");
            });
        });

        describe("Remove Strategy", function () {
            beforeEach(async function () {
                await vault.connect(manager).addStrategy(mockStrategy.address);
            });

            it("Should remove strategy successfully", async function () {
                await expect(vault.connect(manager).removeStrategy(mockStrategy.address))
                    .to.emit(vault, "StrategyRemoved")
                    .withArgs(mockStrategy.address);

                expect(await vault.isStrategy(mockStrategy.address)).to.be.false;
            });

            it("Should revert if not manager", async function () {
                await expect(vault.connect(alice).removeStrategy(mockStrategy.address))
                    .to.be.revertedWith("MultiTokenVault: caller is not a manager");
            });

            it("Should revert if strategy doesn't exist", async function () {
                await expect(vault.connect(manager).removeStrategy(bob.address))
                    .to.be.revertedWithCustomError(vault, "StrategyDoesNotExist");
            });
        });

        describe("Execute Strategy", function () {
            beforeEach(async function () {
                await vault.connect(manager).addStrategy(mockStrategy.address);
            });

            it("Should execute strategy successfully", async function () {
                const data = "0x12345678";
                
                await expect(vault.connect(agent).executeStrategy(mockStrategy.address, data))
                    .to.emit(vault, "StrategyExecuted")
                    .withArgs(mockStrategy.address, data);
            });

            it("Should revert if not agent", async function () {
                await expect(vault.connect(alice).executeStrategy(mockStrategy.address, "0x"))
                    .to.be.revertedWith("MultiTokenVault: caller is not an agent");
            });

            it("Should revert if strategy doesn't exist", async function () {
                await expect(vault.connect(agent).executeStrategy(bob.address, "0x"))
                    .to.be.revertedWithCustomError(vault, "StrategyDoesNotExist");
            });
        });
    });

    describe("Access Control", function () {
        it("Should allow owner to grant roles", async function () {
            const MANAGER_ROLE = await vault.MANAGER_ROLE();
            
            await vault.connect(owner).grantRole(MANAGER_ROLE, alice.address);
            expect(await vault.hasRole(MANAGER_ROLE, alice.address)).to.be.true;
        });

        it("Should allow owner to revoke roles", async function () {
            const MANAGER_ROLE = await vault.MANAGER_ROLE();
            
            await vault.connect(owner).revokeRole(MANAGER_ROLE, manager.address);
            expect(await vault.hasRole(MANAGER_ROLE, manager.address)).to.be.false;
        });

        it("Should not allow non-admin to grant roles", async function () {
            const MANAGER_ROLE = await vault.MANAGER_ROLE();
            
            await expect(
                vault.connect(alice).grantRole(MANAGER_ROLE, bob.address)
            ).to.be.reverted;
        });
    });

    describe("No ETH Support", function () {
        it("Should revert on receive ETH", async function () {
            await expect(
                alice.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("1") })
            ).to.be.revertedWith("ERC20 tokens only");
        });
    });
}); 