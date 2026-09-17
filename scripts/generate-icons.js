// scripts/generate-icons.js
// Generates high-quality PWA icons (192x192, 512x512, maskable, and SVG) for WARUNG OS
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// 1. Generate crisp SVG Icon
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF6B35" />
      <stop offset="100%" stop-color="#C24417" />
    </linearGradient>
    <linearGradient id="awningOrange" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="counterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F3F4F6" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.28" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />

  <!-- Main Warung Kiosk Group -->
  <g filter="url(#shadow)">
    <!-- Stall Wall -->
    <rect x="116" y="210" width="280" height="150" rx="12" fill="url(#counterGrad)" />
    <!-- Shop Window Opening -->
    <rect x="136" y="222" width="240" height="96" rx="8" fill="#1F2421" />

    <!-- Stylized "W" inside shop window -->
    <path d="M165 240 L185 298 L212 248 L238 298 L258 240 L274 240 L248 306 L226 306 L201 258 L176 306 L154 306 L128 240 Z" fill="#F59E0B" transform="translate(45, 0)" />

    <!-- Stall Counter Top Bar -->
    <rect x="96" y="322" width="320" height="22" rx="11" fill="#F59E0B" />

    <!-- Awning / Canopy -->
    <!-- Awning Base Layer -->
    <path d="M 126 120 L 386 120 L 426 215 L 86 215 Z" fill="#FFFFFF" />
    
    <!-- Stripes: 5 stripes (Amber / White alternating) -->
    <!-- Stripe 1 (Left) -->
    <path d="M 126 120 L 178 120 L 154 215 L 86 215 Z" fill="url(#awningOrange)" />
    <!-- Stripe 3 (Center) -->
    <path d="M 230 120 L 282 120 L 282 215 L 230 215 Z" fill="url(#awningOrange)" />
    <!-- Stripe 5 (Right) -->
    <path d="M 334 120 L 386 120 L 426 215 L 358 215 Z" fill="url(#awningOrange)" />

    <!-- Scalloped Awning Fringe -->
    <circle cx="114" cy="215" r="28" fill="url(#awningOrange)" />
    <circle cx="171" cy="215" r="28" fill="#FFFFFF" />
    <circle cx="228" cy="215" r="28" fill="url(#awningOrange)" />
    <circle cx="284" cy="215" r="28" fill="url(#awningOrange)" />
    <circle cx="341" cy="215" r="28" fill="#FFFFFF" />
    <circle cx="398" cy="215" r="28" fill="url(#awningOrange)" />

    <!-- Text Badge "WARUNG OS" -->
    <rect x="116" y="375" width="280" height="52" rx="26" fill="#FFFFFF" />
    <text x="256" y="411" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="26" font-weight="900" fill="#E05A2B" text-anchor="middle" letter-spacing="2">WARUNG OS</text>
  </g>
</svg>
`;

// 2. Pure JavaScript PNG Encoder
function makeCrcTable() {
  let c; const t = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    t[n] = c;
  }
  return t;
}
const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0;
    const rowStart = y * width * 4;
    rgbaBuffer.copy(scanlines, offset, rowStart, rowStart + width * 4);
    offset += width * 4;
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// 3. Pixel Rendering Engine
class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a === 255) {
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      this.data[idx + 3] = a;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.data[idx] = Math.round(r * alpha + this.data[idx] * invAlpha);
      this.data[idx + 1] = Math.round(g * alpha + this.data[idx + 1] * invAlpha);
      this.data[idx + 2] = Math.round(b * alpha + this.data[idx + 2] * invAlpha);
      this.data[idx + 3] = Math.min(255, this.data[idx + 3] + a);
    }
  }

  fillGradient(r1, g1, b1, r2, g2, b2) {
    for (let y = 0; y < this.height; y++) {
      const t = y / this.height;
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, r, g, b, 255);
      }
    }
  }

  fillRect(x, y, w, h, [r, g, b, a = 255]) {
    for (let py = Math.max(0, y); py < Math.min(this.height, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(this.width, x + w); px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  fillRoundRect(x, y, w, h, radius, color) {
    for (let py = Math.max(0, y); py < Math.min(this.height, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(this.width, x + w); px++) {
        let inside = true;
        // Check 4 corners
        if (px < x + radius && py < y + radius) {
          inside = ((px - (x + radius)) ** 2 + (py - (y + radius)) ** 2) <= radius ** 2;
        } else if (px > x + w - radius && py < y + radius) {
          inside = ((px - (x + w - radius)) ** 2 + (py - (y + radius)) ** 2) <= radius ** 2;
        } else if (px < x + radius && py > y + h - radius) {
          inside = ((px - (x + radius)) ** 2 + (py - (y + h - radius)) ** 2) <= radius ** 2;
        } else if (px > x + w - radius && py > y + h - radius) {
          inside = ((px - (x + w - radius)) ** 2 + (py - (y + h - radius)) ** 2) <= radius ** 2;
        }
        if (inside) {
          this.setPixel(px, py, color[0], color[1], color[2], color[3] ?? 255);
        }
      }
    }
  }

  fillCircle(cx, cy, r, [cr, cg, cb, ca = 255]) {
    const r2 = r * r;
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + r));

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const d2 = (px - cx) ** 2 + (py - cy) ** 2;
        if (d2 <= r2) {
          this.setPixel(px, py, cr, cg, cb, ca);
        }
      }
    }
  }

  // Draw trapezoid/quadrilateral for awning
  fillQuad(p1, p2, p3, p4, color) {
    // bounding box
    const minX = Math.max(0, Math.floor(Math.min(p1[0], p2[0], p3[0], p4[0])));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(p1[0], p2[0], p3[0], p4[0])));
    const minY = Math.max(0, Math.floor(Math.min(p1[1], p2[1], p3[1], p4[1])));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(p1[1], p2[1], p3[1], p4[1])));

    const pts = [p1, p2, p3, p4];
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        // Point in convex polygon test (cross product signs)
        let hasNeg = false, hasPos = false;
        for (let i = 0; i < 4; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % 4];
          const cross = (px - a[0]) * (b[1] - a[1]) - (py - a[1]) * (b[0] - a[0]);
          if (cross < 0) hasNeg = true;
          if (cross > 0) hasPos = true;
        }
        if (!(hasNeg && hasPos)) {
          this.setPixel(px, py, color[0], color[1], color[2], color[3] ?? 255);
        }
      }
    }
  }
}

// 4. Render Warung Icon to Canvas
function renderWarungIcon(size, isMaskable = false) {
  const canvas = new Canvas(size, size);
  const scale = size / 512;

  // Background gradient: #FF6B35 -> #C24417
  canvas.fillGradient(255, 107, 53, 194, 68, 23);

  // If not maskable, we can round the corners nicely
  if (!isMaskable) {
    const radius = Math.round(96 * scale);
    // clip outside radius if needed, or leave full bleed (Android standardizes launcher masking)
  }

  // Warung Stall Structure
  const cWhite = [255, 255, 255, 255];
  const cAmber = [245, 158, 11, 255];
  const cDarkAmber = [217, 119, 6, 255];
  const cSlate = [31, 36, 33, 255];
  const cWarmCream = [243, 244, 246, 255];
  const cTerracotta = [224, 90, 43, 255];

  // Shop Stall Body (Behind Awning)
  canvas.fillRoundRect(
    Math.round(116 * scale),
    Math.round(210 * scale),
    Math.round(280 * scale),
    Math.round(150 * scale),
    Math.round(16 * scale),
    cWhite
  );

  // Shop Window Opening
  canvas.fillRoundRect(
    Math.round(136 * scale),
    Math.round(222 * scale),
    Math.round(240 * scale),
    Math.round(96 * scale),
    Math.round(10 * scale),
    cSlate
  );

  // Stylized "W" inside shop window
  // Draw geometric "W" using lines / quads
  const wPoints = [
    // Left diagonal down
    [[165, 238], [182, 238], [202, 298], [185, 298]],
    // Left diagonal up
    [[185, 298], [202, 298], [230, 246], [215, 246]],
    // Right diagonal down
    [[215, 246], [230, 246], [256, 298], [240, 298]],
    // Right diagonal up
    [[240, 298], [256, 298], [288, 238], [271, 238]],
  ];
  const wOffset = 45;
  for (const quad of wPoints) {
    const scaledQuad = quad.map(([x, y]) => [(x + wOffset) * scale, y * scale]);
    canvas.fillQuad(scaledQuad[0], scaledQuad[1], scaledQuad[2], scaledQuad[3], cAmber);
  }

  // Stall Counter Top Bar
  canvas.fillRoundRect(
    Math.round(96 * scale),
    Math.round(322 * scale),
    Math.round(320 * scale),
    Math.round(22 * scale),
    Math.round(11 * scale),
    cAmber
  );

  // Canopy Base / Awning
  // Strip 1: Amber
  canvas.fillQuad(
    [126 * scale, 120 * scale],
    [178 * scale, 120 * scale],
    [154 * scale, 215 * scale],
    [86 * scale, 215 * scale],
    cAmber
  );
  // Strip 2: White
  canvas.fillQuad(
    [178 * scale, 120 * scale],
    [230 * scale, 120 * scale],
    [222 * scale, 215 * scale],
    [154 * scale, 215 * scale],
    cWhite
  );
  // Strip 3: Amber
  canvas.fillQuad(
    [230 * scale, 120 * scale],
    [282 * scale, 120 * scale],
    [282 * scale, 215 * scale],
    [222 * scale, 215 * scale],
    cAmber
  );
  // Strip 4: White
  canvas.fillQuad(
    [282 * scale, 120 * scale],
    [334 * scale, 120 * scale],
    [358 * scale, 215 * scale],
    [282 * scale, 215 * scale],
    cWhite
  );
  // Strip 5: Amber
  canvas.fillQuad(
    [334 * scale, 120 * scale],
    [386 * scale, 120 * scale],
    [426 * scale, 215 * scale],
    [358 * scale, 215 * scale],
    cAmber
  );

  // Awning Scallops
  const scallopR = 27 * scale;
  const scallopY = 215 * scale;
  const scallops = [
    { x: 114 * scale, col: cAmber },
    { x: 171 * scale, col: cWhite },
    { x: 228 * scale, col: cAmber },
    { x: 284 * scale, col: cAmber },
    { x: 341 * scale, col: cWhite },
    { x: 398 * scale, col: cAmber },
  ];
  for (const sc of scallops) {
    canvas.fillCircle(sc.x, scallopY, scallopR, sc.col);
  }

  // Text Plaque "WARUNG OS"
  canvas.fillRoundRect(
    Math.round(116 * scale),
    Math.round(375 * scale),
    Math.round(280 * scale),
    Math.round(52 * scale),
    Math.round(26 * scale),
    cWhite
  );

  // Inner Orange Accent in Plaque
  canvas.fillRoundRect(
    Math.round(124 * scale),
    Math.round(381 * scale),
    Math.round(264 * scale),
    Math.round(40 * scale),
    Math.round(20 * scale),
    cTerracotta
  );

  // Draw high-contrast clean geometric letters: "WARUNG OS" in white inside the plaque
  // Simple 5x7 block bitmap font for "WARUNG OS"
  const font5x7 = {
    'W': [
      "10001",
      "10001",
      "10001",
      "10101",
      "10101",
      "11011",
      "10001"
    ],
    'A': [
      "01110",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001"
    ],
    'R': [
      "11110",
      "10001",
      "10001",
      "11110",
      "10100",
      "10010",
      "10001"
    ],
    'U': [
      "10001",
      "10001",
      "10001",
      "10001",
      "10001",
      "10001",
      "01110"
    ],
    'N': [
      "10001",
      "11001",
      "10101",
      "10011",
      "10001",
      "10001",
      "10001"
    ],
    'G': [
      "01110",
      "10001",
      "10000",
      "10111",
      "10001",
      "10001",
      "01110"
    ],
    ' ': [
      "000",
      "000",
      "000",
      "000",
      "000",
      "000",
      "000"
    ],
    'O': [
      "01110",
      "10001",
      "10001",
      "10001",
      "10001",
      "10001",
      "01110"
    ],
    'S': [
      "01111",
      "10000",
      "10000",
      "01110",
      "00001",
      "00001",
      "11110"
    ]
  };

  const text = "WARUNG OS";
  const charPixelSize = Math.max(1, Math.round(2.6 * scale));
  const spacing = Math.round(3 * scale);
  
  // Calculate total text width
  let totalWidth = 0;
  for (const ch of text) {
    const glyph = font5x7[ch] || font5x7[' '];
    totalWidth += glyph[0].length * charPixelSize + spacing;
  }
  totalWidth -= spacing;

  let startX = Math.round((size - totalWidth) / 2);
  const startY = Math.round(389 * scale);

  for (const ch of text) {
    const glyph = font5x7[ch] || font5x7[' '];
    const glyphWidth = glyph[0].length;
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyphWidth; col++) {
        if (glyph[row][col] === '1') {
          canvas.fillRect(
            startX + col * charPixelSize,
            startY + row * charPixelSize,
            charPixelSize,
            charPixelSize,
            cWhite
          );
        }
      }
    }
    startX += glyphWidth * charPixelSize + spacing;
  }

  return canvas;
}

// 5. Build and Write All PWA Assets
const outDir = path.resolve('public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write SVG
fs.writeFileSync(path.join(outDir, 'icon.svg'), svgIcon);
console.log('✓ Wrote public/icons/icon.svg');

// Render 192x192
const c192 = renderWarungIcon(192, false);
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, c192.data));
console.log('✓ Wrote public/icons/icon-192.png');

// Render 512x512
const c512 = renderWarungIcon(512, false);
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, c512.data));
console.log('✓ Wrote public/icons/icon-512.png');

// Render Maskable 192x192
const cMask192 = renderWarungIcon(192, true);
fs.writeFileSync(path.join(outDir, 'icon-maskable-192.png'), createPng(192, 192, cMask192.data));
console.log('✓ Wrote public/icons/icon-maskable-192.png');

// Render Maskable 512x512
const cMask512 = renderWarungIcon(512, true);
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), createPng(512, 512, cMask512.data));
console.log('✓ Wrote public/icons/icon-maskable-512.png');

// Also write favicon.ico / favicon.png
fs.writeFileSync(path.resolve('public', 'favicon.png'), createPng(192, 192, c192.data));
console.log('✓ Wrote public/favicon.png');
