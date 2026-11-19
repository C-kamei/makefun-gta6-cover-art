// Render engine for Vice Cover — a multi-panel GTA-style poster maker.
// One state object describes the whole poster; drawPoster() paints it onto any
// canvas at any size, so the live preview and the exported PNG are the same art.
// No Rockstar artwork, logos or fonts are used anywhere: every shape, gradient
// and letter here is drawn from scratch with the canvas 2D API.

/** The three panel layouts. Each returns panel rects (fractions of w/h) plus the caption band. */
export function layoutPanels(layout, w, h) {
  const caption = { x: 0, y: 0.84, w: 1, h: 0.16 };
  if (layout === 'neon') {
    return {
      panels: [
        { x: 0, y: 0, w: 0.34, h: 0.84 },
        { x: 0.34, y: 0, w: 0.33, h: 0.84 },
        { x: 0.67, y: 0, w: 0.33, h: 0.84 },
      ],
      caption,
    };
  }
  if (layout === 'boulevard') {
    return {
      panels: [
        { x: 0, y: 0, w: 0.58, h: 0.84 },
        { x: 0.58, y: 0, w: 0.42, h: 0.42 },
        { x: 0.58, y: 0.42, w: 0.42, h: 0.42 },
      ],
      caption,
    };
  }
  // 'sunset' (default): one big hero panel on top, two smaller panels below it.
  return {
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.24 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.24 },
    ],
    caption,
  };
}

/** Colour grades: [top tint, mid tint, bottom tint] plus the caption band colours. */
export const GRADES = {
  sunset: {
    tints: ['rgba(255,170,60,0.10)', 'rgba(255,90,120,0.16)', 'rgba(140,30,160,0.34)'],
    band: ['#2a0a4a', '#c2187a', '#ff7a2f'],
    accent: '#ffd23f',
  },
  neon: {
    tints: ['rgba(0,220,255,0.10)', 'rgba(120,60,255,0.16)', 'rgba(255,0,150,0.32)'],
    band: ['#0a0a2e', '#4a00b8', '#ff2ea6'],
    accent: '#2ee6ff',
  },
  noir: {
    tints: ['rgba(0,200,190,0.08)', 'rgba(20,90,120,0.18)', 'rgba(5,10,40,0.38)'],
    band: ['#06121f', '#0e3a5c', '#00b8a9'],
    accent: '#ff5a5a',
  },
};

/** The export sizes the bounty asks for, in pixels. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080 (square)' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350 (portrait)' },
  landscape: { w: 1920, h: 1080, label: '1920 x 1080 (landscape)' },
};

/** A fresh, empty poster state. */
export function freshState() {
  return {
    layout: 'sunset',
    grade: 'sunset',
    gradeStrength: 1,
    size: 'square',
    title: 'Sunset Heist',
    subtitle: 'VICE CITY NIGHTS',
    titleStyle: 'pop',
    sunMotif: true,
    // photos[i]: { img, name, zoom, ox, oy } — ox/oy are -0.5..0.5 pan offsets.
    photos: [],
    // panels[i] is the index into photos[] shown in panel i.
    panels: [0, 0, 0],
  };
}

/** Draws one photo into a rect, cover-fit, with the photo's zoom and pan applied. */
export function drawPhotoInto(ctx, img, rect, zoom, ox, oy) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img) {
    // Empty slot: a dusk gradient with a faint sun, so the poster never looks broken.
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(0.6, '#c2187a');
    g.addColorStop(1, '#ff7a2f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,210,63,0.85)';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.42, Math.min(w, h) * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const s = base * (zoom || 1);
    const pw = img.naturalWidth * s;
    const ph = img.naturalHeight * s;
    // Pan only as far as the photo overhangs the rect: never expose the
    // empty canvas behind it (a square photo in a square panel has no slack).
    const maxOx = Math.max(0, (pw - w) / 2 / w);
    const maxOy = Math.max(0, (ph - h) / 2 / h);
    const cx = x + w / 2 + Math.max(-maxOx, Math.min(maxOx, ox || 0)) * w;
    const cy = y + h / 2 + Math.max(-maxOy, Math.min(maxOy, oy || 0)) * h;
    ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  }
  ctx.restore();
}

/** A retro striped sun, drawn from scratch, for the hero panel's corner. */
function drawSunMotif(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, '#ffd23f');
  g.addColorStop(0.55, '#ff7a2f');
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20,5,40,0.55)';
  let sy = y + r * 0.1;
  let sh = r * 0.09;
  while (sy < y + r) {
    ctx.fillRect(x - r, sy, r * 2, sh);
    sy += sh * 2.4;
    sh *= 1.25;
  }
  ctx.restore();
}

/** Bold poster lettering: white fill, dark outline, coloured drop shadow. */
function drawTitle(ctx, text, cx, baseline, size, style, accent) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const font = (s) => `italic 900 ${s}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  let s = size;
  ctx.font = font(s);
  try { ctx.letterSpacing = `${Math.max(1, s * 0.02)}px`; } catch { /* older canvas: no letter-spacing */ }
  const maxW = ctx.canvas.width * 0.92;
  while (s > 14 && ctx.measureText(text).width > maxW) {
    s -= 2;
    ctx.font = font(s);
    try { ctx.letterSpacing = `${Math.max(1, s * 0.02)}px`; } catch { /* ignore */ }
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14051f';
  ctx.lineWidth = Math.max(2, s * 0.09);
  if (style === 'neon') {
    ctx.shadowColor = accent;
    ctx.shadowBlur = s * 0.45;
    ctx.strokeText(text, cx, baseline);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baseline);
    ctx.shadowBlur = s * 0.18;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.fillText(text, cx, baseline);
    ctx.globalAlpha = 1;
  } else {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = s * 0.16;
    ctx.shadowOffsetY = s * 0.05;
    ctx.strokeText(text, cx, baseline);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baseline);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // A thin accent underline keeps the title anchored to the band.
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = accent;
    ctx.fillRect(cx - tw / 2, baseline + s * 0.1, tw, Math.max(3, s * 0.045));
  }
  ctx.restore();
  return s;
}

/**
 * Paints the whole poster described by `state` onto `canvas` (at its own size).
 * `state.photos` holds loaded images; a missing photo paints a dusk placeholder.
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const strength = state.gradeStrength ?? 1;
  const { panels, caption } = layoutPanels(state.layout, w, h);

  ctx.fillStyle = '#14051f';
  ctx.fillRect(0, 0, w, h);

  // Panels: photo, then the sunset/neon grade washed over it.
  panels.forEach((p, i) => {
    const rect = { x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h };
    const photo = state.photos[state.panels[i]] || null;
    drawPhotoInto(ctx, photo ? photo.img : null, rect, photo ? photo.zoom : 1, photo ? photo.ox : 0, photo ? photo.oy : 0);
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grade.tints.forEach((c, j) => wash.addColorStop(j / (grade.tints.length - 1), c));
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * strength;
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Warm vignette so panels read as one poster.
    const vg = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,2,25,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Black gutters between panels, poster style.
  const gut = Math.max(4, Math.round(w * 0.008));
  ctx.strokeStyle = '#0d0218';
  ctx.lineWidth = gut;
  panels.forEach((p) => {
    ctx.strokeRect(p.x * w + gut / 2, p.y * h + gut / 2, p.w * w - gut, p.h * h - gut);
  });

  // Retro sun motif on the hero panel. In the narrow-strip layout it sits
  // near the foot of the strip, so it never covers a face.
  if (state.sunMotif) {
    const hero = panels[0];
    const narrow = state.layout === 'neon';
    const sx = hero.x * w + hero.w * w * (narrow ? 0.5 : 0.86);
    const sy = hero.y * h + hero.h * h * (narrow ? 0.9 : 0.2);
    drawSunMotif(ctx, sx, sy, Math.min(w, h) * (narrow ? 0.045 : 0.055));
  }

  // Caption band: a sunset gradient with the bold title and the subtitle.
  const band = { x: caption.x * w, y: caption.y * h, w: caption.w * w, h: caption.h * h };
  const bg = ctx.createLinearGradient(band.x, band.y, band.x + band.w, band.y);
  grade.band.forEach((c, j) => bg.addColorStop(j / (grade.band.length - 1), c));
  ctx.fillStyle = bg;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(band.x, band.y, band.w, Math.max(2, h * 0.003));

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    drawTitle(ctx, title, w / 2, band.y + band.h * 0.58, band.h * 0.52, state.titleStyle, grade.accent);
  }
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ss = Math.max(10, band.h * 0.17);
    ctx.font = `700 ${ss}px "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${ss * 0.32}px`; } catch { /* ignore */ }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(sub, w / 2, band.y + band.h * 0.88);
    ctx.restore();
  }
  return ctx;
}
