// --- Tab switching ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');

    // stop camera if leaving scan tab
    if (btn.dataset.tab !== 'scan' && html5QrCode && scanning) {
      stopScanning();
    }
  });
});

// --- QR Generation ---
const qrInput = document.getElementById('qrInput');
const qrSize = document.getElementById('qrSize');
const qrColor = document.getElementById('qrColor');
const generateBtn = document.getElementById('generateBtn');
const qrResult = document.getElementById('qrResult');
const qrCanvasWrap = document.getElementById('qrCanvasWrap');
const downloadQrBtn = document.getElementById('downloadQrBtn');

let currentCanvas = null;

generateBtn.addEventListener('click', () => {
  const text = qrInput.value.trim();
  if (!text) {
    alert('Please enter some text or a URL first.');
    return;
  }

  qrCanvasWrap.innerHTML = '';
  const canvas = document.createElement('canvas');

  QRCode.toCanvas(canvas, text, {
    width: parseInt(qrSize.value),
    margin: 2,
    color: {
      dark: qrColor.value,
      light: '#ffffff'
    }
  }, (err) => {
    if (err) {
      console.error(err);
      alert('Failed to generate QR code.');
      return;
    }
    qrCanvasWrap.appendChild(canvas);
    currentCanvas = canvas;
    qrResult.classList.remove('hidden');
  });
});

downloadQrBtn.addEventListener('click', () => {
  if (!currentCanvas) return;
  const a = document.createElement('a');
  a.href = currentCanvas.toDataURL('image/png');
  a.download = `qrcode-${Date.now()}.png`;
  a.click();
});

// --- QR Scanning ---
let html5QrCode = null;
let scanning = false;

const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const scanHint = document.getElementById('scanHint');
const qrFileInput = document.getElementById('qrFileInput');
const scanResultBox = document.getElementById('scanResultBox');
const scanResultText = document.getElementById('scanResultText');
const copyResultBtn = document.getElementById('copyResultBtn');

startScanBtn.addEventListener('click', async () => {
  html5QrCode = new Html5Qrcode('reader');
  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      onScanSuccess,
      () => {} // ignore per-frame errors
    );
    scanning = true;
    startScanBtn.classList.add('hidden');
    stopScanBtn.classList.remove('hidden');
    scanHint.textContent = 'Point your camera at a QR code.';
  } catch (err) {
    console.error(err);
    scanHint.textContent = 'Could not access camera. Check permissions, or upload an image instead.';
  }
});

stopScanBtn.addEventListener('click', stopScanning);

function stopScanning() {
  if (html5QrCode && scanning) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      scanning = false;
      startScanBtn.classList.remove('hidden');
      stopScanBtn.classList.add('hidden');
      scanHint.textContent = 'Click "Start Camera" to scan a QR code, or upload an image.';
    }).catch(console.error);
  }
}

function onScanSuccess(decodedText) {
  showScanResult(decodedText);
  stopScanning();
}

qrFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const tempScanner = new Html5Qrcode('reader');
  try {
    const decodedText = await tempScanner.scanFile(file, false);
    showScanResult(decodedText);
  } catch (err) {
    scanHint.textContent = 'No QR code found in that image.';
    console.error(err);
  } finally {
    tempScanner.clear();
  }
});

function showScanResult(text) {
  scanResultText.textContent = text;
  scanResultBox.classList.remove('hidden');
}

copyResultBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(scanResultText.textContent).then(() => {
    copyResultBtn.textContent = 'Copied!';
    setTimeout(() => (copyResultBtn.textContent = 'Copy'), 1500);
  });
});
