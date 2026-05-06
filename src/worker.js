function update() {
  // eslint-disable-next-line no-restricted-globals
  self.postMessage('');
  setTimeout(update, 1000 / 60);
}

update();
/* eslint-enable */
