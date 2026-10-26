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

// game/src/Rules.ts
var Rules_exports = {};
__export(Rules_exports, {
  Rules: () => Rules,
  levels: () => levels,
  region: () => region
});
module.exports = __toCommonJS(Rules_exports);
var copy = (b) => b.map((r) => r.slice());
function region(board, r, c) {
  const color = board[r]?.[c];
  if (!color)
    return [];
  const queue = [[r, c]], seen = /* @__PURE__ */ new Set([`${r},${c}`]);
  for (let i = 0; i < queue.length; i++)
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = queue[i][0] + dr, nc = queue[i][1] + dc, key = `${nr},${nc}`;
      if (board[nr]?.[nc] === color && !seen.has(key)) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    }
  return queue;
}
var Rules = class {
  constructor(level) {
    this.level = level;
    this.result = "playing";
    this.busy = false;
    this.selected = "B";
    this.changed = [];
    this.team = [];
    this.history = [];
    this.reset();
  }
  reset() {
    this.board = copy(this.level.board);
    this.moves = this.level.moves;
    this.history = [];
    this.busy = false;
    this.changed = [];
    this.team = [];
    this.judge();
  }
  select(color) {
    if (!this.busy)
      this.selected = color;
  }
  start(r, c) {
    if (this.busy || this.result !== "playing" || !this.board[r]?.[c] || this.board[r][c] === this.selected)
      return false;
    this.changed = region(this.board, r, c);
    this.history.push({ board: copy(this.board), moves: this.moves });
    for (const [y, x] of this.changed)
      this.board[y][x] = this.selected;
    this.team = region(this.board, r, c);
    this.moves--;
    this.busy = true;
    return true;
  }
  finish() {
    if (this.busy) {
      this.busy = false;
      this.judge();
    }
  }
  undo() {
    if (this.busy)
      return false;
    const old = this.history.pop();
    if (!old)
      return false;
    this.board = old.board;
    this.moves = old.moves;
    this.changed = [];
    this.team = [];
    this.judge();
    return true;
  }
  judge() {
    this.result = this.board.every((row) => row.every((c) => c === this.level.target)) ? "win" : this.moves <= 0 ? "fail" : "playing";
  }
};
var levels = [
  { name: "01 \xB7 \u8FDE\u63A5\u8FB9\u754C", purpose: "\u9EC4\u9EC4\u84DD\u9EC4\u9EC4\uFF1A\u84DD\u8272\u4E0D\u4F1A\u6210\u4E3A\u672C\u6B21\u67D3\u8272\u7684\u6865\u6881", board: [["Y", "Y", "B", "Y", "Y"]], target: "B", moves: 2 },
  { name: "02 \xB7 \u8FC7\u6E21\u6392\u7EC3", purpose: "\u5148\u63A5\u6210\u9EC4\u961F\uFF0C\u518D\u63A5\u7EA2\u961F\uFF0C\u6700\u540E\u5168\u5458\u53D8\u84DD", board: [["R", "Y", "R", "B"], ["R", "Y", "R", "B"], ["R", "Y", "R", "B"], ["R", "Y", "R", "B"]], target: "B", moves: 3 },
  { name: "03 \xB7 \u56DB\u8272\u96C6\u5408", purpose: "4\xD74 \u56DB\u8272\u961F\u4F0D\uFF1B\u53EF\u64A4\u9500\u5C1D\u8BD5\u4E0D\u540C\u5408\u5E76\u987A\u5E8F", board: [["R", "R", "Y", "Y"], ["R", "R", "Y", "Y"], ["G", "G", "B", "B"], ["G", "G", "B", "B"]], target: "B", moves: 3 }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Rules,
  levels,
  region
});
