// lib/compositor.js
import { SCALE } from "./boothConfig";

export function layoutCanvasSize(layout) {
  return { w: Math.round(layout.printW * SCALE), h: Math.round(layout.printH * SCALE) };
}

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h, filterCss, radius) {
  ctx.save();
  if (radius) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  ctx.filter = filterCss || "none";
  const ir = img.width / img.height;
  const tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sy = 0;
    sx = (img.width - sw) / 2;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function darkOrLightText(hex) {
  const c = (hex || "#3B2734").replace("#", "");
  if (c.length !== 6) return "#3B2734";
  const r = parseInt(c.substr(0, 2), 16),
    g = parseInt(c.substr(2, 2), 16),
    b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.45 ? "#FFFFFF" : "#3B2734";
}

function drawCaption(ctx, w, centerY, areaH, frameColor, caption) {
  ctx.fillStyle = darkOrLightText(frameColor);
  ctx.font = "italic 500 " + Math.round(areaH * 0.42) + "px Fraunces, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(caption || "BoothPH ✦", w / 2, centerY);
}

/**
 * Draws the full photo strip (frame color, photos, caption,
 * stickers) onto the given canvas element based on the current state.
 */
export async function drawStripToCanvas(canvas, { layout, shots, filter, frameColor, caption, stickers }) {
  if (!layout || !canvas) return;
  const { w, h } = layoutCanvasSize(layout);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, w, h);

  const captionH = Math.round(SCALE * 0.34);
  const bottomH = captionH;

  if (layout.cols === 1 && layout.rows === 1) {
    const pad = Math.round(SCALE * 0.14);
    const photoW = w - pad * 2;
    const photoH = h - pad * 2 - bottomH;
    if (shots[0]) {
      const img = await loadImage(shots[0]);
      drawCover(ctx, img, pad, pad, photoW, photoH, filter.css);
    }
    drawCaption(ctx, w, h - bottomH / 2, captionH, frameColor, caption);
  } else {
    // Clean border-frame look (matches classic photo-strip references):
    // a solid color border all around, thin matching-color gaps between
    // photos, and the brand text only at the bottom — no header block.
    const stripeW = w / layout.cols;
    const pad = Math.round(stripeW * 0.07);
    const gap = Math.round(stripeW * 0.035);
    const availH = h - pad * 2 - bottomH;
    const cellH = (availH - gap * (layout.rows - 1)) / layout.rows;
    const cellW = stripeW - pad * 2;

    let shotIdx = 0;
    for (let c = 0; c < layout.cols; c++) {
      const stripeX = c * stripeW;
      for (let r = 0; r < layout.rows; r++) {
        const cellY = pad + r * (cellH + gap);
        const cellX = stripeX + pad;
        if (shots[shotIdx]) {
          const img = await loadImage(shots[shotIdx]);
          drawCover(ctx, img, cellX, cellY, cellW, cellH, filter.css, 6);
        }
        shotIdx++;
      }
    }
    drawCaption(ctx, w, h - bottomH / 2, captionH, frameColor, caption);
  }

  for (const s of stickers) {
    if (s.imageUrl) {
      try {
        const img = await loadImage(s.imageUrl);
        const size = s.size * 1.6;
        ctx.drawImage(img, s.x * w - size / 2, s.y * h - size / 2, size, size);
      } catch {
        // if the image fails to load, skip it rather than breaking the whole render
      }
    } else {
      ctx.font = s.size + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x * w, s.y * h);
    }
  }
}
