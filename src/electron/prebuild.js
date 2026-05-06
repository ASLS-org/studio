/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const https = require('https');
// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

function getBinaryName(platform, arch) {
  if (platform === 'linux') {
    return `wsc-server-node18-linux-${arch}`;
  }

  if (platform === 'darwin') {
    return `wsc-server-node18-macos-${arch}`;
  }

  if (platform === 'win32') {
    return `wsc-server-node18-win-${arch}.exe`;
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    function request(currentUrl) {
      https.get(currentUrl, (response) => {
        // Follow redirects
        if (
          response.statusCode === 301
          || response.statusCode === 302
        ) {
          return request(response.headers.location);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}`),
          );
          return null;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(resolve);
        });
        return null;
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }

    request(url);
  });
}
exports.default = async () => {
  const version = process.env.WSC_VERSION || 'v0.8.4';

  const platform = process.env.TARGET_PLATFORM;
  const arch = process.env.TARGET_ARCH;

  const binaryName = getBinaryName(platform, arch);

  const url = `https://github.com/ASLS-org/WSC/releases/download/v${version}/${binaryName}`;

  const outputDir = path.join(__dirname, './', 'bin');
  const outputFile = path.join(outputDir, binaryName);

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Downloading ${binaryName}`);
  console.log(url);

  await download(url, outputFile);

  fs.chmodSync(outputFile, 0o755);

  console.log('Done');
};
