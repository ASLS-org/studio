const transparentOverlay = document.createElement('div');
Object.assign(transparentOverlay.style, {
  position: 'fixed',
  height: '100vh',
  width: '100vw',
  background: 'transparent',
  cursor: 'pointer',
  display: 'none',
});
document.body.appendChild(transparentOverlay);

let TOHandle = null;

function releaseCapture() {
  transparentOverlay.style.display = 'none';
  transparentOverlay.removeEventListener('mouseup', releaseCapture);
}

export default function setCapture(el, cursorStyle = 'unset') {
  transparentOverlay.addEventListener('mouseup', releaseCapture);
  if (TOHandle) {
    clearTimeout(TOHandle);
    TOHandle = null;
  } else if (el && el instanceof HTMLElement) {
    transparentOverlay.style.cursor = cursorStyle;
    transparentOverlay.style.display = 'block';
    clearTimeout(TOHandle);
    TOHandle = null;
  } else {
    throw new Error({
      message: `Expecting instance of HTMLELement. got ${el}`,
    });
  }
}
