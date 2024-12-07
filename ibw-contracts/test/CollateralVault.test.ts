import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CollateralVault, TestBNB, TestUSDC } from "../typechain-types";

describe("CollateralVault", function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let validator: SignerWithAddress;
    let vault: CollateralVault;
    let tbnb: TestBNB;
    let tusdc: TestUSDC;
    
    const INITIAL_BNB_PRICE = 300_000_000; // $300 with 6 decimals
    
    beforeEach(async function () {
        [owner, user, validator] = await ethers.getSigners();
        
        // Deploy test tokens
        const TestBNB = await ethers.getContractFactory("TestBNB");
        tbnb = await TestBNB.deploy();
        
        const TestUSDC = await ethers.getContractFactory("TestUSDC");
        tusdc = await TestUSDC.deploy();
        
        // Deploy vault
        const CollateralVault = await ethers.getContractFactory("CollateralVault");
        vault = await CollateralVault.deploy(
            await tbnb.getAddress(),
            await tusdc.getAddress(),
            INITIAL_BNB_PRICE
        );
        
        // Setup initial balances
        await tbnb.mint(user.address, ethers.parseEther("10"));
        await tusdc.mint(vault.getAddress(), ethers.parseUnits("3000", 6));
        
        // Approve vault to spend user's BNB
        await tbnb.connect(user).approve(vault.getAddress(), ethers.MaxUint256);
        
        // Register validator
        await vault.connect(validator).registerValidator();
    });
    
    describe("Basic Operations", function () {
        it("Should allow depositing collateral and borrowing USDC", async function () {
            const bnbAmount = ethers.parseEther("1"); // 1 BNB
            const usdcAmount = ethers.parseUnits("150", 6); // $150 USDC
            
            await vault.connect(user).depositCollateralAndBorrow(bnbAmount, usdcAmount);
            
            const position = await vault.getPosition(user.address);
            expect(position.collateralAmount).to.equal(bnbAmount);
            expect(position.usdcBorrowed).to.equal(usdcAmount);
        });
        
        it("Should enforce minimum collateral ratio", async function () {
            const bnbAmount = ethers.parseEther("1"); // 1 BNB = $300
            const usdcAmount = ethers.parseUnits("200", 6); // Trying to borrow $200 USDC
            
            await expect(
                vault.connect(user).depositCollateralAndBorrow(bnbAmount, usdcAmount)
            ).to.be.revertedWith("Insufficient collateral ratio");
        });
    });
    
    describe("Price Updates and Liquidations", function () {
        beforeEach(async function () {
            // Setup a position
            await vault.connect(user).depositCollateralAndBorrow(
                ethers.parseEther("1"),
                ethers.parseUnits("150", 6)
            );
        });
        
        it("Should allow price updates and trigger liquidations", async function () {
            // Drop BNB price to $200
            const newPrice = 200_000_000;
            await vault.connect(owner).updatePrice(newPrice);
            
            // Validator checks and liquidates
            await vault.connect(validator).checkAndLiquidatePosition(user.address);
            
            const position = await vault.getPosition(user.address);
            expect(position.collateralAmount).to.be.lt(ethers.parseEther("1"));
        });
        
        it("Should not allow non-validators to liquidate", async function () {
            await vault.connect(owner).updatePrice(200_000_000);
            
            await expect(
                vault.connect(user).checkAndLiquidatePosition(user.address)
            ).to.be.revertedWith("Not a validator");
        });
        
        it("Should not liquidate safe positions", async function () {
            await expect(
                vault.connect(validator).checkAndLiquidatePosition(user.address)
            ).to.be.revertedWith("Position is safe");
        });
    });
}); 