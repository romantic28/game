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

// game/src/Wave.ts
var Wave_exports = {};
__export(Wave_exports, {
  planWave: () => planWave,
  waveProgress: () => waveProgress
});
module.exports = __toCommonJS(Wave_exports);
function planWave(changed, r, c) {
  const allowed = new Set(changed.map(([y, x]) => `${y},${x}`));
  const queue = [[r, c, 0]], seen = /* @__PURE__ */ new Set([`${r},${c}`]);
  const starts = [0];
  const result = [];
  for (let i = 0; i < queue.length; i++) {
    const [y, x, d] = queue[i];
    if (!allowed.has(`${y},${x}`))
      continue;
    if (starts[d] === void 0)
      starts[d] = starts[d - 1] + Math.max(100 * Math.pow(0.85, d - 1), 40);
    const duration = Math.max(380 * Math.pow(0.96, d), 280);
    const direction = y === r && x === c ? "center" : Math.abs(x - c) >= Math.abs(y - r) ? x > c ? "left" : "right" : y > r ? "top" : "bottom";
    result.push({ r: y, c: x, dx: x - c, dy: y - r, distance: d, start: starts[d], duration, direction });
    for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ny = y + dy, nx = x + dx, key = `${ny},${nx}`;
      if (allowed.has(key) && !seen.has(key)) {
        seen.add(key);
        queue.push([ny, nx, d + 1]);
      }
    }
  }
  return result;
}
function waveProgress(elapsed, cell) {
  const t = Math.max(0, Math.min(1, (elapsed - cell.start) / cell.duration));
  return t;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  planWave,
  waveProgress
});
