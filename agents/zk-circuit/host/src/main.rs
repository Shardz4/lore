use methods::{ZK_CIRCUIT_GUEST_ELF, ZK_CIRCUIT_GUEST_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};

fn main() {
    // This is the private data we want to prove we processed correctly without revealing it
    let private_input = String::from("{\"action\": \"trade\", \"secret\": \"SECRET_ENTERPRISE_KEY\"}");

    println!("Starting ZK Proof generation...");

    // Set up the executor environment with the private input
    let env = ExecutorEnv::builder()
        .write(&private_input)
        .unwrap()
        .build()
        .unwrap();

    // Obtain the default prover (can be local or Bonsai network)
    let prover = default_prover();

    // Produce a receipt by proving the specified ELF binary
    let receipt = prover
        .prove(env, ZK_CIRCUIT_GUEST_ELF)
        .unwrap()
        .receipt;

    // The receipt contains the journal (the public output committed by the guest)
    let public_output: String = receipt.journal.decode().unwrap();

    println!("ZK Proof Generated Successfully!");
    println!("Public Output: {}", public_output);
    println!("Image ID: {:?}", ZK_CIRCUIT_GUEST_ID);
}
