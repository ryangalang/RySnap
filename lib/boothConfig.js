// lib/boothConfig.js
export const SCALE = 130; // px per inch used for canvas resolution

export const LAYOUTS = [
  { id: "2x6-3", cols: 1, rows: 3, shots: 3, printW: 2, printH: 6, label: "1", badge: "2x6", desc: "2x6 · 3 photos" },
  { id: "2x6-4", cols: 1, rows: 4, shots: 4, printW: 2, printH: 6, label: "2", badge: "2x6", desc: "2x6 · 4 photos" },
  { id: "4x6-6", cols: 2, rows: 3, shots: 6, printW: 4, printH: 6, label: "3", badge: "4x6", desc: "4x6 (2 stripes) · 6 photos" },
  { id: "4x6-1", cols: 1, rows: 1, shots: 1, printW: 4, printH: 6, label: "4", badge: "4x6", desc: "4x6 portrait · 1 photo" },
];

export const ANGLES = [
  { id: "high", name: "High Angle", desc: "Camera tilted slightly above eye level — gives a slimmer look." },
  { id: "normal", name: "Normal / Eye-level", desc: "Straight-on and natural — the classic angle." },
  { id: "low", name: "Low Angle", desc: "Camera positioned slightly below — a more dramatic look." },
];

export const FILTERS = [
  { id: "natural", name: "Natural", css: "none" },
  { id: "vivid", name: "Vivid", css: "saturate(1.45) contrast(1.12)" },
  { id: "bw", name: "B & W", css: "grayscale(1) contrast(1.08)" },
  { id: "vintage", name: "Vintage", css: "sepia(0.35) contrast(0.92) brightness(1.05) saturate(0.8)" },
  { id: "soft", name: "Soft Glam", css: "brightness(1.1) saturate(0.92) contrast(0.94)" },
];

export const COLORS = [
  "#FFFFFF", "#FDF4F7", "#F7C9D6", "#F3A6C0", "#E8749A", "#D45C82", "#B03B63",
  "#FADADD", "#F6D186", "#F2A65A", "#E4C1F9", "#C9A8E0", "#A87FC7", "#8A6FBF",
  "#A8DAD1", "#7FC8BA", "#5FA79A", "#BFD8AF", "#8FBF6B",
  "#A8C8E8", "#7FA8D9", "#3B2734", "#5C4353", "#EAF6F3", "#1E1E1E",
];

export const STICKERS = ["🐻", "🐰", "🐼", "🐱", "🐶", "🎀", "💗", "✨", "🦋", "🌸", "🌈", "🎉", "❤️", "⭐️", "🌙", "☁️"];

export const VIBES = [
  { id: "kawaii", name: "Kawaii", color: "#F7C9D6", stickers: [{ e: "🐻", x: 0.14, y: 0.09 }, { e: "💗", x: 0.86, y: 0.09 }, { e: "✨", x: 0.86, y: 0.93 }] },
  { id: "y2k", name: "Y2K", color: "#C9A8E0", stickers: [{ e: "⭐️", x: 0.15, y: 0.08 }, { e: "🦋", x: 0.85, y: 0.9 }] },
  { id: "minimal", name: "Minimalist", color: "#FFFFFF", stickers: [] },
  { id: "vintage", name: "Vintage Film", color: "#F6D186", stickers: [{ e: "☁️", x: 0.85, y: 0.08 }] },
  { id: "garden", name: "Garden Party", color: "#A8DAD1", stickers: [{ e: "🌸", x: 0.14, y: 0.09 }, { e: "🌈", x: 0.85, y: 0.9 }] },
];
