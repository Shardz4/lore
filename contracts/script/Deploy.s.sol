// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LoreAuditLedger.sol";

contract DeployZKVerifierLedger is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");
        bytes32 guestImageId = vm.envBytes32("GUEST_IMAGE_ID");

        vm.startBroadcast(deployerPrivateKey);
        
        LoreZKVerifierLedger ledger = new LoreZKVerifierLedger(verifierAddress, guestImageId);
        
        vm.stopBroadcast();
        
        console.log("Deployed LoreZKVerifierLedger to:", address(ledger));
    }
}
