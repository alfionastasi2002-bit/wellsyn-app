// Sagome della scala evolutiva (Australopiteco -> Homo sapiens) per l'animazione d'ingresso.
// Ogni figura è costruita da forme semplici: la testa e il busto sono curve morbide che passano per i punti
// del profilo; braccia e gambe sono catene di "capsule" (cerchi uniti) per articolazioni e muscoli.
// Gli arti sono separati dal corpo così possono oscillare camminando (ruotano attorno ad anca e spalla).
// Coordinate in un riquadro 90×120, terreno a y = 116, figure rivolte a destra.

const r1 = (n) => Math.round(n * 10) / 10;

/** Capsula tra due cerchi (x, y, raggio): contorno a poligono fitto. */
function capsule([x1, y1, a], [x2, y2, b], steps = 9) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(Math.max(-1, Math.min(1, (a - b) / d)));
  const pts = [];
  // arco sul secondo cerchio (lato lontano), poi sul primo (lato opposto)
  for (let i = 0; i <= steps; i += 1) {
    const ang = th + al - (2 * al * i) / steps;
    pts.push([x2 + b * Math.cos(ang), y2 + b * Math.sin(ang)]);
  }
  for (let i = 0; i <= steps * 2; i += 1) {
    const ang = th - al - ((2 * Math.PI - 2 * al) * i) / (steps * 2);
    pts.push([x1 + a * Math.cos(ang), y1 + a * Math.sin(ang)]);
  }
  if (area(pts) < 0) pts.reverse();
  return `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;
}

/** Area con segno di un poligono (per avere tutte le forme nello stesso verso). */
function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Catena di cerchi → più capsule (un arto con articolazioni e muscoli). */
const chain = (circles) => circles.slice(1).map((c, i) => capsule(circles[i], c)).join('');

/** Curva chiusa morbida (Catmull-Rom → Bézier) passante per i punti. */
function blob(input) {
  const points = area(input) < 0 ? [...input].reverse() : input;
  const n = points.length;
  const p = (i) => points[(i + n) % n];
  let d = `M${r1(p(0)[0])} ${r1(p(0)[1])}`;
  for (let i = 0; i < n; i += 1) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    d += `C${r1(x1 + (x2 - x0) / 6)} ${r1(y1 + (y2 - y0) / 6)} ${r1(x2 - (x3 - x1) / 6)} ${r1(y2 - (y3 - y1) / 6)} ${r1(x2)} ${r1(y2)}`;
  }
  return `${d}Z`;
}

// Le cinque specie (riquadro 90×120, terreno a y = 116, guardano a destra)

const SPECIES = [
  {
    name: 'Australopithecus',
    // basso e curvo, schiena a gobba, pancia, braccia lunghe fin sotto le ginocchia, muso sporgente
    head: [[51, 52.5], [50.5, 49], [53, 45.8], [57, 44.8], [60.5, 46], [62.5, 48.2], [63, 49.5], [66.5, 51.5], [68, 54], [67, 55.8], [64.5, 57.8], [61, 59.5], [56, 60.5], [53, 59]],
    torso: [[51, 53], [44, 54.5], [37.5, 59.5], [33, 67], [30, 75], [28.5, 82.5], [30.5, 88], [36.5, 88], [42, 84.5], [46.5, 79], [49.5, 72.5], [52.5, 66], [55, 61.5], [55.5, 59]],
    neck: [[52, 55, 5.2], [54.5, 58.5, 5]],
    hip: [32.5, 82],
    shoulder: [47, 61.5],
    legA: [[33, 82, 7.4], [36, 88.5, 6], [39.5, 95.5, 4.2], [38, 101.5, 4.6], [35.5, 112.5, 2.6]],
    footA: [[34.5, 114.3, 2.6], [44.5, 115, 1.9]],
    legB: [[31.5, 82, 7.2], [31, 89, 5.8], [30.5, 96, 4.1], [28.5, 102, 4.5], [26, 112.5, 2.6]],
    footB: [[25, 114.3, 2.6], [35, 115, 1.9]],
    armA: [[48, 61.5, 5.6], [49.5, 70, 4.6], [51, 79, 3.7], [52, 87, 3.5], [52.5, 95, 2.8], [53, 103, 3.1]],
    armB: [[45.5, 61.5, 5.4], [44.5, 70, 4.4], [43.5, 79, 3.6], [42.5, 87, 3.4], [42, 95, 2.7], [41.5, 102.5, 3]],
  },
  {
    name: 'Homo habilis',
    head: [[48, 43], [46.5, 39], [49.5, 34.8], [54, 34], [58, 35.5], [60, 38.2], [60.2, 39.6], [63.2, 41.8], [64.4, 44.4], [63.4, 46.2], [61, 48], [57.8, 49.5], [53.5, 50.5], [50.5, 49.5]],
    torso: [[48, 44], [42, 45.5], [37, 51.5], [34, 59], [32.5, 67], [32, 74], [34.5, 79.5], [40.5, 79], [45.5, 74.5], [48.5, 67.5], [51, 60], [53, 54], [53.5, 49.5]],
    neck: [[48.5, 45.5, 4.8], [51, 49.5, 4.6]],
    hip: [35.5, 72],
    shoulder: [45.5, 51],
    legA: [[36, 72, 7], [38, 81, 5.6], [40.5, 91, 4], [39.5, 99, 4.5], [37.5, 112.5, 2.4]],
    footA: [[36.5, 114.3, 2.4], [46.5, 115, 1.8]],
    legB: [[35, 72, 6.8], [34, 81, 5.4], [33, 91, 3.9], [31, 99, 4.4], [29, 112.5, 2.4]],
    footB: [[28, 114.3, 2.4], [38, 115, 1.8]],
    armA: [[45.5, 51.5, 5.2], [46.5, 60, 4.2], [47.5, 68, 3.4], [48.5, 76, 3.2], [49, 82, 2.5], [49.5, 89, 2.8]],
    armB: [[43, 51.5, 5], [42, 60, 4], [41, 68, 3.3], [40, 76, 3.1], [39.5, 82, 2.4], [39, 88.5, 2.7]],
  },
  {
    name: 'Homo erectus',
    // alto e quasi eretto, cranio lungo e basso, arcata sopraccigliare marcata, niente mento
    head: [[40.5, 27.5], [38, 23], [40, 17.5], [45, 14.5], [50, 15], [53, 17.5], [55.6, 20.3], [55.2, 21.6], [57.4, 24.4], [55.8, 25.4], [56.2, 27.2], [54.8, 29.4], [52.5, 31.5], [48, 32], [44.5, 30.5]],
    torso: [[42, 29.5], [38, 32.5], [35.5, 39], [35.5, 47], [37, 53.5], [35.5, 60], [36.5, 66.5], [41, 69.5], [46.5, 66.5], [48, 58.5], [47.5, 51], [49.5, 43.5], [49, 36], [46.5, 31]],
    neck: [[43, 28.5, 4.3], [44.5, 33, 4.3]],
    hip: [40, 62],
    shoulder: [42.5, 36.5],
    legA: [[40.5, 62, 6.9], [42, 74, 5.5], [43, 88, 3.7], [42, 97, 4.3], [41, 112.5, 2.4]],
    footA: [[40, 114.3, 2.4], [50.5, 115, 1.8]],
    legB: [[39.5, 62, 6.7], [38, 74, 5.3], [36.5, 88, 3.6], [34.5, 97, 4.2], [32.5, 112.5, 2.4]],
    footB: [[31.5, 114.3, 2.4], [42, 115, 1.8]],
    armA: [[42.5, 37, 4.8], [43.5, 45, 3.8], [44, 53, 2.9], [45.5, 61, 2.7], [46.5, 67, 2.2], [47.5, 73.5, 2.5]],
    armB: [[41, 37, 4.6], [39.5, 45, 3.6], [38.5, 53, 2.8], [37.5, 61, 2.6], [37, 67, 2.1], [36.5, 73, 2.4]],
    // bastone tenuto nella mano davanti
    staffA: [[54, 44, 0.95], [44, 106, 0.95]],
  },
  {
    name: 'Homo neanderthalensis',
    // robusto e massiccio, cranio lungo, naso grande, niente mento
    head: [[39.5, 33], [36.2, 29.5], [37, 24.5], [41.5, 20.8], [48.5, 20.3], [52.3, 22.4], [55.2, 25], [54.9, 26.4], [58.6, 29.8], [56.4, 31.4], [56.8, 33.3], [55.2, 35.6], [52.5, 37.8], [47.5, 38.3], [43.5, 36.6]],
    torso: [[41, 35.5], [36.5, 38.5], [33.5, 45], [33, 53], [34.5, 59], [33, 65], [34, 71], [39.5, 74.5], [46, 71.5], [48, 63], [48, 56], [50.5, 48], [50.5, 40.5], [47, 36]],
    neck: [[42, 34.5, 5.2], [44, 39, 5.2]],
    hip: [39.5, 66],
    shoulder: [42, 42],
    legA: [[40, 66, 7.6], [41.5, 77, 6.2], [42.5, 89, 4.4], [41.5, 98, 5], [40.5, 112.5, 2.7]],
    footA: [[39.5, 114.3, 2.7], [50, 115, 2]],
    legB: [[39, 66, 7.4], [37.5, 77, 6], [36, 89, 4.3], [34, 98, 4.9], [32, 112.5, 2.7]],
    footB: [[31, 114.3, 2.7], [41.5, 115, 2]],
    armA: [[42, 42.5, 5.8], [43, 51, 4.6], [43.5, 58, 3.6], [45, 66, 3.3], [46, 71.5, 2.7], [47, 77.5, 2.9]],
    armB: [[40.5, 42.5, 5.6], [39, 51, 4.4], [38, 58, 3.5], [37, 66, 3.2], [36.5, 71.5, 2.6], [36, 77, 2.8]],
    // lancia in diagonale nella mano dietro
    staffB: [[21, 100, 0.95], [58, 46, 0.95]],
  },
  {
    name: 'Homo sapiens',
    // alto ed eretto, cranio alto e tondo, fronte verticale, naso e mento
    head: [[38, 15.5], [39, 9.5], [43.5, 6], [49, 6.5], [52, 9.5], [53, 13.5], [53, 16.5], [55.2, 19.3], [53.6, 20.3], [54, 22.2], [53.2, 23.8], [52.6, 25.8], [50, 27.5], [46.5, 27.5], [43.5, 25.5], [40.5, 22]],
    torso: [[42, 26.5], [38.5, 29], [36.5, 34.5], [36.5, 42], [38, 49], [36.5, 56], [37.5, 63], [42, 66.5], [47, 63.5], [48.5, 56], [48, 49], [49.5, 41], [49, 33], [46.5, 28.5]],
    neck: [[43.5, 24.5, 3.6], [44.5, 30, 3.8]],
    hip: [41, 59],
    shoulder: [43, 33.5],
    legA: [[41.5, 59, 6.8], [43, 72, 5.3], [44, 87, 3.5], [43, 96, 4.2], [42, 112.5, 2.2]],
    footA: [[41, 114.3, 2.2], [51.5, 115, 1.6]],
    legB: [[40.5, 59, 6.6], [39, 72, 5.1], [37.5, 87, 3.4], [35.5, 96, 4.1], [33.5, 112.5, 2.2]],
    footB: [[32.5, 114.3, 2.2], [43, 115, 1.6]],
    armA: [[43, 33.5, 4.4], [44, 42, 3.4], [44.5, 50, 2.6], [46, 58, 2.4], [47, 63.5, 1.9], [48, 70, 2.3]],
    armB: [[41.5, 33.5, 4.2], [40, 42, 3.2], [39, 50, 2.5], [38, 58, 2.3], [37.5, 63.5, 1.8], [37, 69.5, 2.2]],
  },
];

/** Le figure pronte da disegnare: corpo e arti come percorsi SVG, più i punti attorno a cui ruotano gli arti. */
export const FIGURES = SPECIES.map((s) => ({
  name: s.name,
  hip: s.hip,
  shoulder: s.shoulder,
  body: blob(s.head) + blob(s.torso) + capsule(...s.neck),
  legA: chain(s.legA) + capsule(...s.footA),
  legB: chain(s.legB) + capsule(...s.footB),
  armA: chain(s.armA) + (s.staffA ? capsule(...s.staffA) : ''),
  armB: chain(s.armB) + (s.staffB ? capsule(...s.staffB) : ''),
}));
