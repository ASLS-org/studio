/* eslint-disable */
const WW_MSG_TYPES = {
  COMPUTE_FX: 'compute-fx',
};

const FX_CHANNEL_WAVEFORMS = {
  SINE: 0,
  TRIANGLE: 1,
  SQUARE: 2,
  PWM: 3,
};

function update() {
  self.postMessage('');
  setTimeout(update, 1000 / 60);
}

function genSine(t, phaseOffset = 0, average, frequency, phaseRad, amplitude) {
  return average + amplitude * Math.sin(2 * Math.PI * frequency * t + phaseRad + phaseOffset);
}

function genTriangle(t, phaseOffset = 0, average, frequency, phaseRad, amplitude) {
  return average + (2 * amplitude / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t + phaseRad + phaseOffset));
}

function getFXValue(t, phaseOffset, waveform, average, min, max, frequency, phaseRad, amplitude) {
  switch (waveform) {
    case FX_CHANNEL_WAVEFORMS.SINE:
      return genSine(t, phaseOffset, average, frequency, phaseRad, amplitude);
    case FX_CHANNEL_WAVEFORMS.TRIANGLE:
      return genTriangle(t, phaseOffset, average, frequency, phaseRad, amplitude);
    case FX_CHANNEL_WAVEFORMS.SQUARE:
      return genSine(t, phaseOffset, average, min, max, frequency, phaseRad, amplitude) >= average ? max : min;
    default:
      return 1;
  }
}

self.addEventListener('message', (e) => {
  const parsedData = JSON.parse(e.data);
  switch (parsedData.msg) {
    case WW_MSG_TYPES.COMPUTE_FX:
      self.postMessage(getFXValue(...parsedData.data));
      break;
  }
});

update();
/* eslint-enable */
