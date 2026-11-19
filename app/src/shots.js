// Fixed scenes for screenshots, driven by the query string.
//   ?shot=cover — the cover alone, full viewport, at the requested export size.
//   ?shot=editor — the full editor with photos loaded.
// Query params: photos (comma list of sample names, e.g. pier,boulevard),
// panels (comma list of photo indexes, e.g. 0,1,0), layout, grade, size,
// title, subtitle, titleStyle. The scene calls `apply` with the parsed scene,
// then sets window.__shotReady once the poster has painted.
export async function runShot(shot, query, apply) {
  const scene = {
    photos: (query.get('photos') || query.get('photo') || 'pier').split(',').filter(Boolean),
    panels: query.get('panels') ? query.get('panels').split(',').map(Number) : null,
    layout: query.get('layout') || 'sunset',
    grade: query.get('grade') || 'sunset',
    size: query.get('size') || 'square',
    title: query.get('caption') || query.get('title') || 'Sunset Heist',
    subtitle: query.get('subtitle') || 'VICE CITY NIGHTS',
    titleStyle: query.get('titleStyle') || 'pop',
    // Optional framing for the first photo: zoom (1..2.5) and pan (-0.5..0.5).
    zoom: Number(query.get('zoom') || '1'),
    panx: Number(query.get('panx') || '0'),
    pany: Number(query.get('pany') || '0'),
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply(scene);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
