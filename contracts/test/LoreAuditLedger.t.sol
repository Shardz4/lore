// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LoreAuditLedger.sol";
import "./MockRiscZeroVerifier.sol";

contract LoreZKVerifierLedgerTest is Test {
    LoreZKVerifierLedger public ledger;
    MockRiscZeroVerifier public mockVerifier;
    bytes32 public guestImageId = bytes32(uint256(12345));

    event ZKProofCommitted(bytes32 indexed journalDigest, uint256 timestamp);

    function setUp() public {
        mockVerifier = new MockRiscZeroVerifier();
        ledger = new LoreZKVerifierLedger(address(mockVerifier), guestImageId);
    }

    function test_CommitVerifiedTrace_Success() public {
        bytes memory seal = abi.encodePacked("dummy-seal");
        bytes32 journalDigest = keccak256(abi.encodePacked("dummy-journal"));

        // Expect event to be emitted
        vm.expectEmit(true, false, false, true);
        emit ZKProofCommitted(journalDigest, block.timestamp);

        ledger.commitVerifiedTrace(seal, journalDigest);
        
        // Assert it was marked verified
        assertTrue(ledger.verifiedJournals(journalDigest));
    }

    function test_CommitVerifiedTrace_ReplayFails() public {
        bytes memory seal = abi.encodePacked("dummy-seal");
        bytes32 journalDigest = keccak256(abi.encodePacked("dummy-journal"));

        ledger.commitVerifiedTrace(seal, journalDigest);

        vm.expectRevert("Journal already verified and committed");
        ledger.commitVerifiedTrace(seal, journalDigest);
    }

    function test_CommitVerifiedTrace_InvalidProofFails() public {
        bytes memory seal = abi.encodePacked("dummy-seal");
        bytes32 journalDigest = keccak256(abi.encodePacked("dummy-journal"));

        mockVerifier.setShouldFail(true);

        vm.expectRevert("Mock verification failed");
        ledger.commitVerifiedTrace(seal, journalDigest);
    }
}
