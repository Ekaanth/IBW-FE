import { ethers } from "hardhat";

async function main() {
  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy IBWVault
  const IBWVault = await ethers.getContractFactory("IBWVault");
  const ibwVault = await IBWVault.deploy(await mockUSDC.getAddress());
  await ibwVault.waitForDeployment();
  console.log("IBWVault deployed to:", await ibwVault.getAddress());

  // Verify contract addresses
  console.log("\nContract Addresses:");
  console.log("------------------");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("IBWVault:", await ibwVault.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 