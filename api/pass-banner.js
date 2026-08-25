/**
 * VYNTA LOYALTY - Serverless Pure PNG Banner Generator for Google & Apple Wallet
 * Produces authentic, high-definition PNG images matching the web card preview.
 */
import zlib from 'zlib';

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const scanlines = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    scanlines[rowOffset] = 0;
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatCompressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [14, 165, 233];
  const c = hex.replace('#', '');
  if (c.length === 3) return [parseInt(c[0]+c[0], 16), parseInt(c[1]+c[1], 16), parseInt(c[2]+c[2], 16)];
  if (c.length === 6) return [parseInt(c.substring(0,2), 16), parseInt(c.substring(2,4), 16), parseInt(c.substring(4,6), 16)];
  return [14, 165, 233];
}

const font5x7 = {
  '0': [0x1F, 0x11, 0x11, 0x11, 0x1F],
  '1': [0x00, 0x02, 0x1F, 0x00, 0x00],
  '2': [0x19, 0x15, 0x15, 0x15, 0x17],
  '3': [0x11, 0x15, 0x15, 0x15, 0x1F],
  '4': [0x07, 0x04, 0x04, 0x1F, 0x04],
  '5': [0x17, 0x15, 0x15, 0x15, 0x1D],
  '6': [0x1F, 0x15, 0x15, 0x15, 0x1D],
  '7': [0x01, 0x01, 0x19, 0x05, 0x03],
  '8': [0x1F, 0x15, 0x15, 0x15, 0x1F],
  '9': [0x17, 0x15, 0x15, 0x15, 0x1F],
  '/': [0x10, 0x08, 0x04, 0x02, 0x01],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  'P': [0x1F, 0x05, 0x05, 0x05, 0x02],
  'U': [0x0F, 0x10, 0x10, 0x10, 0x0F],
  'N': [0x1F, 0x02, 0x04, 0x08, 0x1F],
  'T': [0x01, 0x01, 0x1F, 0x01, 0x01],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x0E],
  'S': [0x12, 0x15, 0x15, 0x15, 0x09],
  'M': [0x1F, 0x02, 0x04, 0x02, 0x1F],
  'E': [0x1F, 0x15, 0x15, 0x11, 0x11],
  'A': [0x1E, 0x05, 0x05, 0x05, 0x1E],
  ':': [0x00, 0x0A, 0x0A, 0x00, 0x00]
};

function drawPixel(buf, width, height, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  if (a === 255) {
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
  } else {
    const alpha = a / 255;
    const inv = 1 - alpha;
    buf[idx] = Math.round(r * alpha + buf[idx] * inv);
    buf[idx + 1] = Math.round(g * alpha + buf[idx + 1] * inv);
    buf[idx + 2] = Math.round(b * alpha + buf[idx + 2] * inv);
    buf[idx + 3] = 255;
  }
}

function drawRoundedRect(buf, width, height, rx, ry, rw, rh, radius, fillRgb, strokeRgb, strokeW = 2) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const dx = Math.min(x - rx, rx + rw - 1 - x);
      const dy = Math.min(y - ry, ry + rh - 1 - y);
      let inCorner = false;
      let dist = 0;
      if (dx < radius && dy < radius) {
        inCorner = true;
        dist = Math.sqrt((radius - dx) ** 2 + (radius - dy) ** 2);
      }

      if (inCorner) {
        if (dist <= radius - strokeW) {
          if (fillRgb) drawPixel(buf, width, height, x, y, fillRgb[0], fillRgb[1], fillRgb[2], fillRgb[3] !== undefined ? fillRgb[3] : 255);
        } else if (dist <= radius) {
          if (strokeRgb) drawPixel(buf, width, height, x, y, strokeRgb[0], strokeRgb[1], strokeRgb[2], strokeRgb[3] !== undefined ? strokeRgb[3] : 255);
        }
      } else {
        const isBorder = (x < rx + strokeW || x >= rx + rw - strokeW || y < ry + strokeW || y >= ry + rh - strokeW);
        if (isBorder && strokeRgb) {
          drawPixel(buf, width, height, x, y, strokeRgb[0], strokeRgb[1], strokeRgb[2], strokeRgb[3] !== undefined ? strokeRgb[3] : 255);
        } else if (!isBorder && fillRgb) {
          drawPixel(buf, width, height, x, y, fillRgb[0], fillRgb[1], fillRgb[2], fillRgb[3] !== undefined ? fillRgb[3] : 255);
        }
      }
    }
  }
}

function drawFilledCircle(buf, width, height, cx, cy, radius, rgb) {
  const r2 = radius * radius;
  for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= r2) {
        drawPixel(buf, width, height, x, y, rgb[0], rgb[1], rgb[2], rgb[3] !== undefined ? rgb[3] : 255);
      }
    }
  }
}

function drawStarOutline(buf, width, height, cx, cy, size, rgb) {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.02) {
    const a = (angle % ((Math.PI * 2) / 5)) - Math.PI / 5;
    const maxR = size * (0.4 + 0.6 * Math.cos(a * 2.5));
    const px = Math.round(cx + Math.cos(angle - Math.PI / 2) * maxR);
    const py = Math.round(cy + Math.sin(angle - Math.PI / 2) * maxR);
    drawPixel(buf, width, height, px, py, rgb[0], rgb[1], rgb[2], rgb[3] !== undefined ? rgb[3] : 255);
    drawPixel(buf, width, height, px + 1, py, rgb[0], rgb[1], rgb[2], rgb[3] !== undefined ? rgb[3] : 255);
  }
}

function drawDigit(buf, width, height, digit, startX, startY, scale, rgb) {
  const glyph = font5x7[digit] || font5x7[' '];
  for (let col = 0; col < 5; col++) {
    const colBits = glyph[col];
    for (let row = 0; row < 7; row++) {
      if ((colBits >> row) & 1) {
        for (let sx = 0; sx < scale; sx++) {
          for (let sy = 0; sy < scale; sy++) {
            drawPixel(buf, width, height, startX + col * scale + sx, startY + row * scale + sy, rgb[0], rgb[1], rgb[2], rgb[3] !== undefined ? rgb[3] : 255);
          }
        }
      }
    }
  }
}

function drawText(buf, width, height, text, startX, startY, scale, rgb) {
  const upper = (text || '').toUpperCase();
  let currX = startX;
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    const glyph = font5x7[char] || font5x7[' '];
    for (let col = 0; col < 5; col++) {
      const colBits = glyph[col];
      for (let row = 0; row < 7; row++) {
        if ((colBits >> row) & 1) {
          for (let sx = 0; sx < scale; sx++) {
            for (let sy = 0; sy < scale; sy++) {
              drawPixel(buf, width, height, currX + col * scale + sx, startY + row * scale + sy, rgb[0], rgb[1], rgb[2], rgb[3] !== undefined ? rgb[3] : 255);
            }
          }
        }
      }
    }
    currX += 6 * scale;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const {
    type = 'stamps',
    stamps = '0',
    total = '10',
    points = '0',
    maxPoints = '100',
    color = '0EA5E9',
    bg = '090A0F',
    text = 'FFFFFF',
    reward = 'Regalo'
  } = req.query || {};

  const numStamps = Math.max(0, parseInt(stamps, 10) || 0);
  const numTotal = Math.max(1, parseInt(total, 10) || 10);
  const numPoints = Math.max(0, parseInt(points, 10) || 0);
  const numMaxPoints = Math.max(1, parseInt(maxPoints, 10) || 100);

  const width = 750;
  const height = 300;
  const buf = Buffer.alloc(width * height * 4);

  const bgRgb = hexToRgb(bg);
  const primRgb = hexToRgb(color);

  // 1. Dark Gradient Background
  for (let y = 0; y < height; y++) {
    const factor = y / height;
    const r = Math.round(bgRgb[0] * (1 - factor * 0.4));
    const g = Math.round(bgRgb[1] * (1 - factor * 0.4));
    const b = Math.round(bgRgb[2] * (1 - factor * 0.4));
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  if (type === 'points') {
    drawText(buf, width, height, 'PUNTOS ACUMULADOS', 240, 40, 3, primRgb);
    drawText(buf, width, height, `${numPoints} PTS`, 300, 95, 6, [255, 255, 255]);

    const barW = 520;
    const barH = 22;
    const startX = 115;
    const startY = 175;
    const pct = Math.min(100, Math.round((numPoints / numMaxPoints) * 100));
    const fillW = Math.max(16, Math.round((barW * pct) / 100));

    for (let by = 0; by < barH; by++) {
      for (let bx = 0; bx < barW; bx++) {
        drawPixel(buf, width, height, startX + bx, startY + by, 255, 255, 255, 30);
      }
      for (let bx = 0; bx < fillW; bx++) {
        drawPixel(buf, width, height, startX + bx, startY + by, primRgb[0], primRgb[1], primRgb[2], 255);
      }
    }

    drawText(buf, width, height, `META: ${numMaxPoints} PTS`, 280, 230, 3, [245, 158, 11]);
  } else {
    // 2. Exact Grid Dimensions for 2 rows of 5 rounded square boxes (Photo 2)
    const cols = 5;
    const boxW = 124;
    const boxH = 118;
    const gapX = 16;
    const gapY = 16;
    const totalW = cols * boxW + (cols - 1) * gapX;
    const startX = Math.round((width - totalW) / 2);
    const startY = 24;

    for (let i = 0; i < numTotal; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (boxW + gapX);
      const by = startY + row * (boxH + gapY);
      const isDone = i < numStamps;

      if (isDone) {
        // Active stamp box
        const fillRgb = [Math.round(primRgb[0] * 0.15 + 20), Math.round(primRgb[1] * 0.15 + 25), Math.round(primRgb[2] * 0.15 + 40), 240];
        const borderRgb = [primRgb[0], primRgb[1], primRgb[2], 255];
        
        drawRoundedRect(buf, width, height, bx - 1, by - 1, boxW + 2, boxH + 2, 19, null, [primRgb[0], primRgb[1], primRgb[2], 80], 2);
        drawRoundedRect(buf, width, height, bx, by, boxW, boxH, 18, fillRgb, borderRgb, 3);

        const numStr = `${i + 1}`;
        if (numStr.length === 1) {
          drawDigit(buf, width, height, numStr[0], bx + 14, by + 14, 3, primRgb);
        } else {
          drawDigit(buf, width, height, numStr[0], bx + 12, by + 14, 3, primRgb);
          drawDigit(buf, width, height, numStr[1], bx + 30, by + 14, 3, primRgb);
        }

        const cx = bx + Math.round(boxW / 2);
        const cy = by + Math.round(boxH / 2) + 12;
        drawFilledCircle(buf, width, height, cx, cy, 14, [primRgb[0], primRgb[1], primRgb[2], 80]);
        drawFilledCircle(buf, width, height, cx, cy, 9, primRgb);
      } else {
        // Inactive stamp box
        const fillRgb = [15, 20, 30, 180];
        const borderRgb = [255, 255, 255, 25];
        drawRoundedRect(buf, width, height, bx, by, boxW, boxH, 18, fillRgb, borderRgb, 2);

        const numStr = `${i + 1}`;
        if (numStr.length === 1) {
          drawDigit(buf, width, height, numStr[0], bx + 14, by + 14, 3, [255, 255, 255, 90]);
        } else {
          drawDigit(buf, width, height, numStr[0], bx + 12, by + 14, 3, [255, 255, 255, 90]);
          drawDigit(buf, width, height, numStr[1], bx + 30, by + 14, 3, [255, 255, 255, 90]);
        }

        const cx = bx + Math.round(boxW / 2);
        const cy = by + Math.round(boxH / 2) + 10;
        drawStarOutline(buf, width, height, cx, cy, 22, [255, 255, 255, 35]);
      }
    }
  }

  const pngBuffer = encodePNG(width, height, buf);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', pngBuffer.length);
  res.end(pngBuffer);
}
