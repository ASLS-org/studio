use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

const WSC_VERSION: &str = env!("WSC_VERSION");

struct WscServer(Mutex<Option<std::process::Child>>);

fn wsc_download_name() -> Result<&'static str, String> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("linux", "x86_64") => Ok("wsc-server-node18-linux-x64"),
        ("linux", "aarch64") => Ok("wsc-server-node18-linux-arm64"),
        ("macos", "x86_64") => Ok("wsc-server-node18-macos-x64"),
        ("macos", "aarch64") => Ok("wsc-server-node18-macos-arm64"),
        ("windows", "x86_64") => Ok("wsc-server-node18-win-x64.exe"),
        ("windows", "aarch64") => Ok("wsc-server-node18-win-arm64.exe"),
        (os, arch) => Err(format!("Unsupported platform: {}-{}", os, arch)),
    }
}

fn wsc_binary_path(app: &tauri::AppHandle) -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    let data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&data_dir)?;
    let name = wsc_download_name()?;
    let binary_name = name
        .replace("node18-linux-x64", "x86_64-unknown-linux-gnu")
        .replace("node18-linux-arm64", "aarch64-unknown-linux-gnu")
        .replace("node18-macos-x64", "x86_64-apple-darwin")
        .replace("node18-macos-arm64", "aarch64-apple-darwin")
        .replace("node18-win-x64", "x86_64-pc-windows-msvc")
        .replace("node18-win-arm64", "aarch64-pc-windows-msvc");
    Ok(data_dir.join(binary_name))
}

async fn download_wsc(path: &PathBuf) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let download_name = wsc_download_name()?;
    let url = format!(
        "https://github.com/ASLS-org/WSC/releases/download/v{}/{}",
        WSC_VERSION, download_name
    );

    log::info!("Downloading WSC {} from {}", WSC_VERSION, url);

    let response = reqwest::get(&url).await?;
    let bytes = response.bytes().await?;
    std::fs::write(path, &bytes)?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(path)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(path, perms)?;
    }

    log::info!("WSC binary ready: {}", path.display());
    Ok(())
}

async fn ensure_wsc(app: tauri::AppHandle) {
    let path = match wsc_binary_path(&app) {
        Ok(p) => p,
        Err(e) => {
            log::error!("WSC path error: {}", e);
            return;
        }
    };

    if !path.exists() {
        if let Err(e) = download_wsc(&path).await {
            log::error!("WSC download failed: {}", e);
            app.dialog()
                .message(format!("Failed to download WSC Gateway: {}", e))
                .title("Error")
                .show(|_| {});
            return;
        }
    }

    match std::process::Command::new(&path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
    {
        Ok(child) => {
            *app.state::<WscServer>().0.lock().unwrap() = Some(child);
            log::info!("WSC server started");
        }
        Err(e) => {
            log::error!("Failed to spawn WSC: {}", e);
            app.dialog()
                .message(format!("Failed to start WSC Gateway: {}", e))
                .title("Error")
                .show(|_| {});
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(WscServer(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(ensure_wsc(handle));
            Ok(())
        })
        .register_uri_scheme_protocol("static", |ctx, request| {
            let path = request.uri().path().trim_start_matches('/').to_string();
            let resource_dir = match ctx.app_handle().path().resource_dir() {
                Ok(dir) => dir,
                Err(_) => {
                    return tauri::http::Response::builder()
                        .status(500)
                        .body(Vec::new())
                        .unwrap()
                }
            };
            let file_path = resource_dir.join("public").join(&path);
            match std::fs::read(&file_path) {
                Ok(data) => {
                    let content_type = match file_path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                    {
                        "json" => "application/json",
                        "glb" => "model/gltf-binary",
                        "gltf" => "model/gltf+json",
                        "png" => "image/png",
                        "jpg" | "jpeg" => "image/jpeg",
                        "svg" => "image/svg+xml",
                        "wasm" => "application/wasm",
                        _ => "application/octet-stream",
                    };
                    tauri::http::Response::builder()
                        .header("Content-Type", content_type)
                        .body(data)
                        .unwrap()
                }
                Err(_) => tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::new())
                    .unwrap(),
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let app = window.app_handle();
                if let Some(mut child) = app.state::<WscServer>().0.lock().unwrap().take() {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
