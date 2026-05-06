/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  net,
  protocol,
} from 'electron';
import {
  electronApp,
  optimizer,
} from '@electron-toolkit/utils';
import path from 'path';
import { spawn } from 'child_process';
import os from 'node:os';
import icon from '../assets/images/studio_standalone_logo.svg';

console.log('MAIN PROCESS STARTED');

process.on('exit', (code) => {
  console.log('💀 PROCESS EXIT EVENT', code);
});

process.on('beforeExit', (code) => {
  console.log('⚠️ BEFORE EXIT', code);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

process.env.ELECTRON_ENABLE_LOGGING = '1';
process.env.ELECTRON_ENABLE_STACK_DUMPING = '1';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'static',
    privileges: {
      bypassCSP: true,
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

let wscServer = null;

function showError(title, err) {
  const message = err?.message || String(err);
  const stack = err?.stack || 'No stack trace available';

  dialog.showMessageBox({
    type: 'error',
    title,
    message,
    detail: stack,
    buttons: ['OK'],
    noLink: true,
  });
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,

    vibrancy: 'under-window', // optional
    visualEffectState: 'active',
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('./out/renderer/index.html');
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow.destroy();
  });
}

function getTargetName() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === 'darwin' && arch === 'arm64') return 'wsc-server-node18-macos-arm64';
  if (platform === 'darwin' && arch === 'x64') return 'wsc-server-node18-macos-x64';

  if (platform === 'linux' && arch === 'x64') return 'wsc-server-node18-linux-x64';
  if (platform === 'linux' && arch === 'arm64') return 'wsc-server-node18-linux-arm64';

  if (platform === 'win32' && arch === 'x64') return 'wsc-server-node18-win-x64.exe';
  if (platform === 'win32' && arch === 'arm64') return 'wsc-server-node18-win-arm64.exe';

  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

function spawnWscServer() {
  const isDev = !app.isPackaged;
  const targetName = getTargetName();
  const binaryPath = isDev
    ? path.join(__dirname, 'src/electron/bin', targetName) // dev path
    : path.join(process.resourcesPath, 'bin', targetName); // packaged path

  wscServer = spawn(binaryPath, [], {
    stdio: 'pipe',
  });

  wscServer.stdout.on('data', (data) => {
    console.log(`[wsc stdout]: ${data}`);
  });

  wscServer.stderr.on('data', (data) => {
    console.error(`[wsc stderr]: ${data}`);
  });

  wscServer.on('close', (code) => {
    console.log(`wsc exited with code ${code}`);
  });

  wscServer.on('error', (err) => {
    console.error('Failed to start wsc:', err);
    showError('Failed to start WSC Gateway', err);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Start local WSC Gateway
  spawnWscServer();

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  /** Forward static files through custom protocol */
  protocol.handle('static', (request) => {
    const url = request.url.substring(7);
    const staticRoot = path.join(__dirname, '../renderer/');
    return net.fetch(`file://${staticRoot}/${url}`);
  });
});

app.on('before-quit', () => {
  BrowserWindow.getAllWindows().forEach((w) => {
    w.destroy();
  });
});

app.on('before-quit', () => {
  protocol.unhandle('static');
});

app.on('window-all-closed', () => {
  if (wscServer && !wscServer.killed) {
    wscServer.kill('SIGTERM');
  }
  app.quit();
});
