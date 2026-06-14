const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockRiscZeroVerifier
  const MockVerifier = await hre.ethers.getContractFactory("MockRiscZeroVerifier");
  console.log("Deploying MockRiscZeroVerifier...");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log("MockRiscZeroVerifier deployed to:", mockVerifierAddress);

  // 2. Deploy LoreZKVerifierLedger
  // Create a 32-byte representation of 0 for GUEST_IMAGE_ID
  const guestImageId = hre.ethers.zeroPadValue("0x00", 32);
  const LoreLedger = await hre.ethers.getContractFactory("LoreZKVerifierLedger");
  console.log("Deploying LoreZKVerifierLedger...");
  const ledger = await LoreLedger.deploy(mockVerifierAddress, guestImageId);
  await ledger.waitForDeployment();
  const ledgerAddress = await ledger.getAddress();
  console.log("LoreZKVerifierLedger deployed to:", ledgerAddress);

  console.log("\nDeployment completed successfully!");
  console.log("Mock Verifier Address:", mockVerifierAddress);
  console.log("Ledger Address:", ledgerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
