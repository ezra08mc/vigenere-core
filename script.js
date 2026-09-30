function vigenere(text, key, mode) {
  const cleanKey = key.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (!cleanKey) {
    throw new Error('Kunci harus berisi minimal satu huruf (A-Z).');
  }

  const A = 'A'.charCodeAt(0);
  let result = '';
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;

    if (!isUpper && !isLower) {
      result += ch;
      continue;
    }

    const base = isUpper ? 65 : 97;
    const letterVal = code - base;
    const keyVal = cleanKey.charCodeAt(keyIndex % cleanKey.length) - A;
    keyIndex++;

    let shifted;
    if (mode === 'encrypt') {
      shifted = (letterVal + keyVal) % 26;
    } else {
      shifted = (letterVal - keyVal + 26) % 26;
    }

    result += String.fromCharCode(base + shifted);
  }

  return result;
}


const state = {
  mode: 'encrypt',
  fileContent: null,
  fileName: null,
};

const tabs = document.querySelectorAll('.tab');
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const fileNameLabel = document.getElementById('fileNameLabel');
const removeFileBtn = document.getElementById('removeFileBtn');
const keyInput = document.getElementById('keyInput');
const inputText = document.getElementById('inputText');
const runBtn = document.getElementById('runBtn');
const clearBtn = document.getElementById('clearBtn');
const resultField = document.getElementById('resultField');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusMsg = document.getElementById('statusMsg');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    state.mode = tab.dataset.mode;
    runBtn.textContent = state.mode === 'encrypt' ? 'Jalankan Enkripsi' : 'Jalankan Dekripsi';
    setStatus('');
  });
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
});

['dragover', 'dragenter'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });
});

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

function removeUploadedFile() {
  state.fileContent = null;
  state.fileName = null;
  fileInput.value = '';
  fileNameLabel.textContent = 'Pilih file atau seret ke sini';
  removeFileBtn.hidden = true;
}

removeFileBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  removeUploadedFile();
  setStatus('File yang diupload telah dihapus.');
});

function loadFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    setStatus('File terlalu besar (maks 10 MB).', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    state.fileContent = e.target.result;
    state.fileName = file.name;
    fileNameLabel.textContent = file.name;
    removeFileBtn.hidden = false;
    setStatus('');
  };
  reader.onerror = () => setStatus('Gagal membaca file.', true);
  reader.readAsText(file);
}

runBtn.addEventListener('click', () => {
  const key = keyInput.value;
  const source = state.fileContent !== null && state.fileContent !== ''
    ? state.fileContent
    : inputText.value;

  if (!source) {
    setStatus('Belum ada teks atau file untuk diproses.', true);
    return;
  }

  try {
    const output = vigenere(source, key, state.mode);
    outputText.value = output;
    resultField.hidden = false;
    setStatus(state.mode === 'encrypt' ? 'Enkripsi selesai.' : 'Dekripsi selesai.');
  } catch (err) {
    setStatus(err.message, true);
  }
});

clearBtn.addEventListener('click', () => {
  removeUploadedFile();
  keyInput.value = '';
  inputText.value = '';
  outputText.value = '';
  resultField.hidden = true;
  setStatus('');
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputText.value);
    setStatus('Hasil disalin ke clipboard.');
  } catch {
    outputText.select();
    document.execCommand('copy');
    setStatus('Hasil disalin ke clipboard.');
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const suffix = state.mode === 'encrypt' ? 'encrypted' : 'decrypted';
  const baseName = state.fileName ? state.fileName.replace(/\.txt$/i, '') : 'hasil';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_${suffix}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function setStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.classList.toggle('error', isError);
}
