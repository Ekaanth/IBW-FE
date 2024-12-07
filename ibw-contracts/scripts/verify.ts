import { run } from "hardhat";

async function main() {
  const DEPLOYED_ADDRESSES = {
    TestBNB: "YOUR_DEPLOYED_TBNB_ADDRESS",
    TestUSDC: "YOUR_DEPLOYED_TUSDC_ADDRESS",
    CollateralVault: "YOUR_DEPLOYED_VAULT_ADDRESS",
    IBWPriceAVS: "YOUR_DEPLOYED_AVS_ADDRESS",
  };

  const EIGENLAYER_SERVICE_MANAGER = "EIGENLAYER_SERVICE_MANAGER_ADDRESS";

  console.log("Verifying contracts...");

  // Verify TestBNB
  await run("verify:verify", {
    address: DEPLOYED_ADDRESSES.TestBNB,
    constructorArguments: [],
  });

  // Verify TestUSDC
  await run("verify:verify", {
    address: DEPLOYED_ADDRESSES.TestUSDC,
    constructorArguments: [],
  });

  // Verify CollateralVault
  await run("verify:verify", {
    address: DEPLOYED_ADDRESSES.CollateralVault,
    constructorArguments: [
      DEPLOYED_ADDRESSES.TestBNB,
      DEPLOYED_ADDRESSES.TestUSDC,
      300_000_000, // Initial BNB price
    ],
  });

  // Verify IBWPriceAVS
  await run("verify:verify", {
    address: DEPLOYED_ADDRESSES.IBWPriceAVS,
    constructorArguments: [
      EIGENLAYER_SERVICE_MANAGER,
      DEPLOYED_ADDRESSES.CollateralVault,
    ],
  });

  console.log("All contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 