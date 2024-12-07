import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy TestBNB
  const TestBNB = await ethers.getContractFactory("TestBNB");
  const testBNB = await TestBNB.deploy();
  await testBNB.waitForDeployment();
  console.log("TestBNB deployed to:", await testBNB.getAddress());

  // Deploy TestUSDC
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = await TestUSDC.deploy();
  await testUSDC.waitForDeployment();
  console.log("TestUSDC deployed to:", await testUSDC.getAddress());

  // Deploy CollateralManager
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(
    await testUSDC.getAddress(),
    await testBNB.getAddress()
  );
  await collateralManager.waitForDeployment();
  console.log("CollateralManager deployed to:", await collateralManager.getAddress());

  // Deploy IBWPriceAVS
  const IBWPriceAVS = await ethers.getContractFactory("IBWPriceAVS");
  const avs = await IBWPriceAVS.deploy(
    process.env.EIGENLAYER_SERVICE_MANAGER || "",
    await collateralManager.getAddress()
  );
  await avs.waitForDeployment();
  console.log("IBWPriceAVS deployed to:", await avs.getAddress());

  // Setup initial permissions
  await collateralManager.setAVSService(await avs.getAddress());
  console.log("Permissions set up");

  // Mint initial supplies
  await testUSDC.mint(collateralManager.getAddress(), ethers.parseUnits("100000", 6));
  await testBNB.mint(deployer.address, ethers.parseEther("1000"));
  console.log("Initial supplies minted");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 