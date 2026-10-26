"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// game/src/PaintFront.ts
var PaintFront_exports = {};
__export(PaintFront_exports, {
  paintFront: () => paintFront
});
module.exports = __toCommonJS(PaintFront_exports);
function paintFront(w, h, p, cell) {
  const phase = cell.r * 0.73 + cell.c * 1.13;
  if (cell.direction === "center") {
    const radius = Math.hypot(w, h) * 0.5 * p;
    const edge2 = [];
    for (let i = 0; i <= 40; i++) {
      const angle = i / 40 * Math.PI * 2;
      const ripple = 1 + (0.075 * Math.sin(angle * 3 + phase) + 0.035 * Math.sin(angle * 7 - phase)) * Math.sin(Math.PI * p);
      edge2.push(w / 2 + Math.cos(angle) * radius * ripple, h / 2 + Math.sin(angle) * radius * ripple);
    }
    return { fill: edge2.slice(0, -2), edge: edge2 };
  }
  const length = Math.hypot(cell.dx, cell.dy), nx = cell.dx / length, ny = cell.dy / length;
  const extent = (Math.abs(nx) * w + Math.abs(ny) * h) / 2;
  const span = (Math.abs(ny) * w + Math.abs(nx) * h) / 2 + 2;
  const edge = [];
  for (let i = 0; i <= 32; i++) {
    const cross = -span + 2 * span * i / 32;
    const ripple = (Math.sin(i / 32 * 7 + phase) * 0.06 + Math.sin(i / 32 * 17 - phase) * 0.025) * Math.min(w, h) * Math.sin(Math.PI * p);
    const along = -extent + p * extent * 2 + ripple;
    edge.push(w / 2 + nx * along - ny * cross, h / 2 + ny * along + nx * cross);
  }
  const back = -extent - Math.min(w, h) * 0.2;
  return { fill: [w / 2 + nx * back + ny * span, h / 2 + ny * back - nx * span, ...edge, w / 2 + nx * back - ny * span, h / 2 + ny * back + nx * span], edge };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  paintFront
});
