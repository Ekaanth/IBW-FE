import { expect } from "chai";
import { ethers } from "hardhat";

describe("CollateralManager", function () {
  let TestBNB;
  let TestUSDC;
  let CollateralManager;
  let testBNB;
  let testUSDC;
  let collateralManager;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy test tokens
    TestBNB = await ethers.getContractFactory("TestBNB");
    testBNB = await TestBNB.deploy();

    TestUSDC = await ethers.getContractFactory("TestUSDC");
    testUSDC = await TestUSDC.deploy();

    // Deploy CollateralManager
    CollateralManager = await ethers.getContractFactory("CollateralManager");
    collateralManager = await CollateralManager.deploy(
      await testUSDC.getAddress(),
      await testBNB.getAddress()
    );

    // Mint initial tokens
    await testBNB.mint(user.address, ethers.parseEther("10"));
    await testUSDC.mint(collateralManager.getAddress(), ethers.parseUnits("10000", 6));

    // Approve collateral manager to spend user's BNB
    await testBNB.connect(user).approve(
      collateralManager.getAddress(),
      ethers.parseEther("10")
    );
  });

  it("Should handle collateralization and liquidation scenario", async function () {
    // Step 1: Deposit 1 BNB and borrow 372.50 USDC
    const depositAmount = ethers.parseEther("1"); // 1 BNB
    const borrowAmount = ethers.parseUnits("372.50", 6); // 372.50 USDC

    await collateralManager.connect(user).depositCollateralAndBorrow(
      depositAmount,
      borrowAmount
    );

    // Verify initial position
    let position = await collateralManager.getPosition(user.address);
    expect(position.collateralAmount).to.equal(depositAmount);
    expect(position.usdcBorrowed).to.equal(borrowAmount);

    // Verify initial ratio
    let ratio = await collateralManager.checkCollateralRatio(user.address);
    expect(ratio).to.equal(200);

    // Step 2: Drop BNB price to $500
    await collateralManager.updatePrice(ethers.parseUnits("500", 6));

    // Verify new ratio
    ratio = await collateralManager.checkCollateralRatio(user.address);
    expect(ratio).to.be.lt(200);

    // Step 3: Trigger liquidation
    await collateralManager.burnExcessCollateral(user.address);

    // Verify final position
    position = await collateralManager.getPosition(user.address);
    ratio = await collateralManager.checkCollateralRatio(user.address);
    
    // Check that ratio is restored to 200%
    expect(ratio).to.equal(200);
  });
}); 