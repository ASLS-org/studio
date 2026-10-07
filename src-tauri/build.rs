fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let env_path = std::path::Path::new(&manifest_dir)
        .parent()
        .unwrap()
        .join(".env");

    println!("cargo:rerun-if-changed=../.env");

    let version = if let Ok(content) = std::fs::read_to_string(&env_path) {
        content
            .lines()
            .find_map(|line| line.strip_prefix("WSC_VERSION="))
            .map(|v| v.trim_matches('"').to_string())
            .unwrap_or_else(|| "2.2.0-rc.6".to_string())
    } else {
        "2.2.0-rc.6".to_string()
    };

    println!("cargo:rustc-env=WSC_VERSION={}", version);
    tauri_build::build()
}
