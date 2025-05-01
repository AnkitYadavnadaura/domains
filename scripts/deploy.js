const hre = require("hardhat");

async function main() {
  console.log("Deploying DomainRegistry contract...");

  // Get the ContractFactory and Signer
  const DomainRegistry = await hre.ethers.getContractFactory("DomainRegistry");
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const domainRegistry = await DomainRegistry.deploy();
  await domainRegistry.waitForDeployment();

  const domainRegistryAddress = await domainRegistry.getAddress();
  console.log("DomainRegistry deployed to:", domainRegistryAddress);

  // Wait for a few confirmations for Etherscan verification
  console.log("Waiting for confirmations...");
  await domainRegistry.deploymentTransaction().wait(5);
  
  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: domainRegistryAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Contract verification failed:", error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});