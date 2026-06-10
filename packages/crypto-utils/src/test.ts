import { generateTree, getRoot, getProof, Decision } from "./index";

const decisions: Decision[] = [
    {
        insightType: "RAGE_CLICK_CLUSTER",
        description: "Users are rage clicking the submit button",
        traceId: "trace-123",
        timestamp: 1690000000
    },
    {
        insightType: "FEATURE_DROPOFF",
        description: "High dropoff at step 2 of checkout",
        traceId: "trace-456",
        timestamp: 1690000100
    }
];

const tree = generateTree(decisions);
const root = getRoot(tree);
console.log("Merkle Root:", root);

const proof = getProof(tree, 0);
console.log("Proof for Decision 0:", proof);
