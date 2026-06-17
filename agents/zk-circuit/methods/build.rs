use std::fs;
use std::path::PathBuf;
use std::env;

#[no_mangle]
pub unsafe extern "C" fn sys_alloc_aligned(_bytes: usize, _align: usize) -> *mut u8 {
    panic!("sys_alloc_aligned should never be called on the host");
}

fn main() {
    let out_dir = env::var("OUT_DIR").map(PathBuf::from).unwrap();
    let methods_path = out_dir.join("methods.rs");

    // Try compiling guest using embed_methods
    let result = std::panic::catch_unwind(|| {
        risc0_build::embed_methods();
    });

    if result.is_err() {
        println!("cargo:warning=RISC Zero guest toolchain not found or compilation failed. Falling back to mock methods constants.");
        // Write mock constants to OUT_DIR/methods.rs so build succeeds
        let mock_content = r#"
            pub const ZK_CIRCUIT_GUEST_ELF: &[u8] = &[];
            pub const ZK_CIRCUIT_GUEST_ID: [u32; 8] = [0, 0, 0, 0, 0, 0, 0, 0];
        "#;
        fs::write(methods_path, mock_content).unwrap();
    }
}
