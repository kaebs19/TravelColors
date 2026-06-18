// مولّد باركود Code39 بصيغة SVG — بدون أي مكتبات خارجية
// يدعم: الأرقام 0-9، الحروف الكبيرة A-Z، والرموز - . $ / + % ومسافة
// مناسب لأرقام الفواتير مثل INV71 / EST-123

// جدول Code39 القياسي: كل حرف 9 عناصر (5 أعمدة + 4 فراغات) بالتناوب،
// n = ضيّق، w = عريض، تبدأ وتنتهي بعمود.
const CODE39 = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn'
};

/**
 * توليد باركود Code39 كنص SVG
 * @param {string} text النص المراد ترميزه (سيُحوّل للأحرف الكبيرة)
 * @param {object} opts { height, narrow, wide, color, showText, fontSize }
 * @returns {string} وسم <svg> جاهز للإدراج
 */
export const code39Svg = (text, opts = {}) => {
  const {
    height = 48,
    narrow = 2,
    wide = 5,
    color = '#1f2937',
    background = 'transparent',
    showText = true,
    fontSize = 12,
    quietZone = 12
  } = opts;

  const raw = String(text || '').toUpperCase();
  // الاكتفاء بالأحرف المدعومة
  const clean = raw.split('').filter((c) => CODE39[c] && c !== '*').join('');
  if (!clean) return '';

  const sequence = `*${clean}*`;
  let x = quietZone;
  const bars = [];

  for (let s = 0; s < sequence.length; s++) {
    const pattern = CODE39[sequence[s]];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === 'w' ? wide : narrow;
      const isBar = i % 2 === 0; // العناصر الزوجية أعمدة سوداء
      if (isBar) {
        bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="${color}" />`);
      }
      x += w;
    }
    x += narrow; // فراغ فاصل بين الأحرف
  }

  const totalWidth = x + quietZone;
  const textH = showText ? fontSize + 6 : 0;
  const svgHeight = height + textH;
  const label = showText
    ? `<text x="${totalWidth / 2}" y="${height + fontSize}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="${color}" letter-spacing="2">${clean}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${svgHeight}">` +
    `<rect width="${totalWidth}" height="${svgHeight}" fill="${background}" />` +
    bars.join('') + label +
    `</svg>`;
};

export default code39Svg;
