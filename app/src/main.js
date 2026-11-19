// Wires the Vice Cover editor: photo slots, layout/grade/size pickers, per-photo
// crop and position, panel assignment, caption editing and PNG export.
// Everything stays on the user's machine: photos are read with FileReader /
// object URLs and never uploaded. `?shot=` scenes for screenshots live in shots.js.
import { drawPoster, freshState, SIZES } from './cover.js';
import { runShot } from './shots.js';

const state = freshState();
const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const previewWrap = document.getElementById('preview');

let activePhoto = 0; // which photo slot the crop sliders edit

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Reads a File into an Image. */
function loadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result).then(resolve, reject);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawPoster(canvas, state);
  syncPanelSelects();
  syncPhotoTabs();
}

/** Keeps the panel photo selects in step with the state. */
function syncPanelSelects() {
  document.querySelectorAll('[data-panel]').forEach((sel) => {
    const i = Number(sel.dataset.panel);
    sel.value = String(state.panels[i]);
  });
}

/** Keeps the photo tabs and crop sliders in step with the active slot. */
function syncPhotoTabs() {
  const photo = state.photos[activePhoto];
  document.querySelectorAll('[data-photo-tab]').forEach((btn) => {
    const i = Number(btn.dataset.photoTab);
    const filled = !!state.photos[i];
    btn.classList.toggle('active', i === activePhoto);
    btn.textContent = filled ? `Photo ${i + 1} ✓` : `Photo ${i + 1} +`;
  });
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('panx');
  const panY = document.getElementById('pany');
  const has = !!photo;
  [zoom, panX, panY].forEach((el) => { el.disabled = !has; });
  if (has) {
    zoom.value = photo.zoom;
    panX.value = photo.ox;
    panY.value = photo.oy;
  }
  document.getElementById('zoomVal').textContent = has ? `${Math.round(photo.zoom * 100)}%` : '—';
  document.getElementById('removePhoto').disabled = !has;
  document.getElementById('fillAll').disabled = !has;
}

/** Adds a photo (an Image) to the first free slot, or replaces the active slot. */
function addPhoto(img, name) {
  const slot = state.photos.findIndex((p) => !p) !== -1
    ? state.photos.findIndex((p) => !p)
    : (state.photos.length < 3 ? state.photos.length : activePhoto);
  state.photos[slot] = { img, name, zoom: 1, ox: 0, oy: 0 };
  activePhoto = slot;
  // A new photo joins the poster: empty panels take it, the hero takes the first.
  state.panels = state.panels.map((p, i) => (i === 0 && state.photos.length === 1 ? slot : p));
  redraw();
  status.textContent = `${name} loaded into Photo ${slot + 1}.`;
}

async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    status.textContent = 'Drop an image file to add it as a photo.';
    return;
  }
  for (const file of images.slice(0, 3)) {
    try {
      addPhoto(await loadFile(file), file.name);
    } catch {
      status.textContent = `Could not read ${file.name}.`;
    }
  }
}

/** Loads a built-in sample photo into a slot. */
async function loadSample(name, slot) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos[slot] = { img, name: `${name}.jpg`, zoom: 1, ox: 0, oy: 0 };
    activePhoto = slot;
    redraw();
    status.textContent = `Sample ${name} loaded into Photo ${slot + 1}.`;
  } catch {
    status.textContent = `Could not load sample ${name}.`;
  }
}

/** Exports the current poster at `sizeKey` as a PNG download. */
function exportPng(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const saved = state.size;
  state.size = sizeKey;
  drawPoster(off, state);
  state.size = saved;
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

// ---- controls ---------------------------------------------------------------
document.getElementById('addPhotos').addEventListener('change', (e) => {
  addFiles(e.target.files);
  e.target.value = '';
});
document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slot = state.photos.findIndex((p) => !p);
    loadSample(btn.dataset.sample, slot === -1 ? activePhoto : slot);
  });
});
document.querySelectorAll('[data-photo-tab]').forEach((btn) => {
  btn.addEventListener('click', () => { activePhoto = Number(btn.dataset.photoTab); syncPhotoTabs(); });
});
document.getElementById('removePhoto').addEventListener('click', () => {
  state.photos[activePhoto] = null;
  state.panels = state.panels.map((p) => (p === activePhoto ? 0 : p));
  redraw();
  status.textContent = `Photo ${activePhoto + 1} removed.`;
});
document.getElementById('fillAll').addEventListener('click', () => {
  state.panels = state.panels.map(() => activePhoto);
  redraw();
  status.textContent = `All panels now show Photo ${activePhoto + 1}.`;
});
document.getElementById('zoom').addEventListener('input', (e) => {
  const p = state.photos[activePhoto];
  if (p) { p.zoom = Number(e.target.value); redraw(); }
});
document.getElementById('panx').addEventListener('input', (e) => {
  const p = state.photos[activePhoto];
  if (p) { p.ox = Number(e.target.value); redraw(); }
});
document.getElementById('pany').addEventListener('input', (e) => {
  const p = state.photos[activePhoto];
  if (p) { p.oy = Number(e.target.value); redraw(); }
});

document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = btn.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
    previewWrap.dataset.size = state.size;
    redraw();
  });
});
document.querySelectorAll('[data-panel]').forEach((sel) => {
  sel.addEventListener('change', () => {
    state.panels[Number(sel.dataset.panel)] = Number(sel.value);
    redraw();
  });
});
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('titleStyle').addEventListener('change', (e) => { state.titleStyle = e.target.value; redraw(); });
document.getElementById('gradeStrength').addEventListener('input', (e) => {
  state.gradeStrength = Number(e.target.value);
  document.getElementById('gradeVal').textContent = `${Math.round(state.gradeStrength * 100)}%`;
  redraw();
});
document.getElementById('sunMotif').addEventListener('change', (e) => { state.sunMotif = e.target.checked; redraw(); });

document.getElementById('exportOne').addEventListener('click', () => exportPng(state.size));
document.getElementById('exportAll').addEventListener('click', () => {
  Object.keys(SIZES).forEach((k, i) => setTimeout(() => exportPng(k), i * 250));
});

// Drag and drop anywhere on the preview, or on the drop zone.
['dragover', 'dragenter'].forEach((ev) => {
  previewWrap.addEventListener(ev, (e) => { e.preventDefault(); previewWrap.classList.add('drag'); });
});
['dragleave', 'drop'].forEach((ev) => {
  previewWrap.addEventListener(ev, (e) => { e.preventDefault(); previewWrap.classList.remove('drag'); });
});
previewWrap.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

// ---- screenshot scenes ------------------------------------------------------
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    state.layout = scene.layout || 'sunset';
    state.grade = scene.grade || 'sunset';
    state.size = scene.size || 'square';
    state.title = scene.title || 'Sunset Heist';
    state.subtitle = scene.subtitle || 'VICE CITY NIGHTS';
    state.titleStyle = scene.titleStyle || 'pop';
    document.getElementById('title').value = state.title;
    document.getElementById('subtitle').value = state.subtitle;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
    previewWrap.dataset.size = state.size;
    for (let i = 0; i < (scene.photos || []).length; i += 1) {
      const img = await loadImage(`samples/${scene.photos[i]}.jpg`);
      const framing = i === 0
        ? { zoom: scene.zoom || 1, ox: scene.panx || 0, oy: scene.pany || 0 }
        : { zoom: 1, ox: 0, oy: 0 };
      state.photos[i] = { img, name: `${scene.photos[i]}.jpg`, ...framing };
    }
    if (scene.panels) state.panels = scene.panels;
    redraw();
  });
} else {
  // First run: load both built-in samples so the poster is alive at once.
  loadSample('pier', 0).then(() => loadSample('boulevard', 1));
}
