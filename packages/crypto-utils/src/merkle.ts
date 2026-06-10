import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export interface Decision {
    insightType: string;
    description: string;
    traceId: string;
    timestamp: number;
}

/**
 * Generates a Merkle Tree from an array of product decisions.
 * Uses keccak256 under the hood.
 */
export function generateTree(decisions: Decision[]): StandardMerkleTree<(string | number)[]> {
    const values = decisions.map(d => [d.insightType, d.description, d.traceId, d.timestamp]);
    // Define the ABI encoding types for the leaves to ensure deterministic hashing
    const tree = StandardMerkleTree.of(values, ["string", "string", "string", "uint256"]);
    return tree;
}

/**
 * Returns the hex-formatted Merkle Root.
 */
export function getRoot(tree: StandardMerkleTree<any[]>): string {
    return tree.root;
}

/**
 * Generates a cryptographic proof for a specific decision at a given index.
 */
export function getProof(tree: StandardMerkleTree<any[]>, index: number): string[] {
    return tree.getProof(index);
}
