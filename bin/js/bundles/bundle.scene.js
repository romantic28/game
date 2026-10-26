"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp(target, key, result);
    return result;
  };

  // src/Rules.ts
  var copy = /* @__PURE__ */ __name((b) => b.map((r) => r.slice()), "copy");
  function region(board, r, c) {
    var _a, _b;
    const color = (_a = board[r]) == null ? void 0 : _a[c];
    if (!color)
      return [];
    const queue = [[r, c]], seen = /* @__PURE__ */ new Set([`${r},${c}`]);
    for (let i = 0; i < queue.length; i++)
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = queue[i][0] + dr, nc = queue[i][1] + dc, key = `${nr},${nc}`;
        if (((_b = board[nr]) == null ? void 0 : _b[nc]) === color && !seen.has(key)) {
          seen.add(key);
          queue.push([nr, nc]);
        }
      }
    return queue;
  }
  __name(region, "region");
  var _Rules = class _Rules {
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
      var _a;
      if (this.busy || this.result !== "playing" || !((_a = this.board[r]) == null ? void 0 : _a[c]) || this.board[r][c] === this.selected)
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
  __name(_Rules, "Rules");
  var Rules = _Rules;
  var levels = [
    { name: "01 · 连接边界", purpose: "黄黄蓝黄黄：蓝色不会成为本次染色的桥梁", board: [["Y", "Y", "B", "Y", "Y"]], target: "B", moves: 2 },
    { name: "02 · 过渡排练", purpose: "先接成黄队，再接红队，最后全员变蓝", board: [["R", "Y", "R", "B"], ["R", "Y", "R", "B"], ["R", "Y", "R", "B"], ["R", "Y", "R", "B"]], target: "B", moves: 3 },
    { name: "03 · 四色集合", purpose: "4×4 四色队伍；可撤销尝试不同合并顺序", board: [["R", "R", "Y", "Y"], ["R", "R", "Y", "Y"], ["G", "G", "B", "B"], ["G", "G", "B", "B"]], target: "B", moves: 3 }
  ];

  // src/Wave.ts
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
  __name(planWave, "planWave");
  function waveProgress(elapsed, cell) {
    const t = Math.max(0, Math.min(1, (elapsed - cell.start) / cell.duration));
    return t;
  }
  __name(waveProgress, "waveProgress");

  // src/PaintFront.ts
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
  __name(paintFront, "paintFront");

  // src/MonsterPlaceholder.ts
  function monsterMask(w, h) {
    const mask = new Laya.Sprite(), g = mask.graphics;
    const radius = Math.min(w, h) * 0.21;
    g.drawRoundRect(w * 0.045, h * 0.2, w * 0.91, h * 0.75, radius, radius, radius, radius, "#fff");
    g.drawPoly(0, 0, [w * 0.13, h * 0.3, w * 0.17, h * 0.035, w * 0.37, h * 0.25], "#fff");
    g.drawPoly(0, 0, [w * 0.63, h * 0.25, w * 0.83, h * 0.035, w * 0.87, h * 0.3], "#fff");
    return mask;
  }
  __name(monsterMask, "monsterMask");
  function monsterFace(w, h) {
    const face = new Laya.Sprite();
    face.name = "monster-face";
    face.mouseEnabled = false;
    const g = face.graphics;
    g.drawPoly(0, 0, [w * 0.155, h * 0.255, w * 0.18, h * 0.075, w * 0.32, h * 0.25], "#f4e6bd");
    g.drawPoly(0, 0, [w * 0.68, h * 0.25, w * 0.82, h * 0.075, w * 0.845, h * 0.255], "#f4e6bd");
    for (const x of [0.34, 0.66]) {
      g.drawCircle(w * x, h * 0.49, w * 0.112, "#fffdf4");
      g.drawCircle(w * (x + 0.018), h * 0.505, w * 0.048, "#20253d");
      g.drawCircle(w * (x + 5e-3), h * 0.485, w * 0.016, "#ffffff");
    }
    g.drawLines(0, 0, [w * 0.41, h * 0.69, w * 0.46, h * 0.725, w * 0.54, h * 0.725, w * 0.59, h * 0.69], "#34304b", Math.max(1.5, w * 0.027));
    g.drawCircle(w * 0.23, h * 0.65, w * 0.045, "rgba(255,220,216,0.50)");
    g.drawCircle(w * 0.77, h * 0.65, w * 0.045, "rgba(255,220,216,0.50)");
    return face;
  }
  __name(monsterFace, "monsterFace");

  // src/PartyView.ts
  var colors = { R: "#fa4b49", Y: "#e8e575", B: "#6da4e9", G: "#52bf79" };
  var names = { R: "红", Y: "黄", B: "蓝", G: "绿" };
  var _PartyView = class _PartyView extends Laya.Sprite {
    constructor() {
      super();
      this.rules = new Rules(levels[0]);
      this.index = 0;
      this.tiles = [];
      this.animation = null;
      this.size(600, 1e3);
      this.refreshUI();
    }
    text(value, x, y, w, size = 24, color = "#edf0ff") {
      const t = new Laya.Text();
      t.text = value;
      t.font = "Microsoft YaHei";
      t.fontSize = size;
      t.color = color;
      t.pos(x, y);
      t.width = w;
      t.height = 60;
      t.align = "center";
      t.wordWrap = true;
      t.mouseEnabled = false;
      this.addChild(t);
      return t;
    }
    button(label, x, y, w, h, fill, action, selected = false, border = true) {
      const b = new Laya.Sprite();
      b.pos(x, y);
      b.size(w, h);
      b.graphics.drawRect(0, 0, w, h, fill, border ? selected ? "#ffffff" : "#434c71" : null, selected ? 4 : 1);
      b.mouseEnabled = true;
      this.addChild(b);
      const t = new Laya.Text();
      t.text = label;
      t.font = "Microsoft YaHei";
      t.fontSize = 24;
      t.color = "#fff";
      t.width = w;
      t.height = h;
      t.align = "center";
      t.valign = "middle";
      t.mouseEnabled = false;
      b.addChild(t);
      b.on(Laya.Event.CLICK, this, action);
      return b;
    }
    styleTile(sprite, r, c) {
      const w = sprite.width, h = sprite.height;
      const mask = monsterMask(w, h);
      sprite.mask = mask;
      const surface = new Laya.Sprite();
      surface.mouseEnabled = false;
      for (let band = 0; band < 4; band++) {
        const points = [];
        for (let i = 0; i <= 16; i++) {
          const x = i * w / 16;
          const y = (0.08 + band * 0.26) * h + Math.sin(i / 16 * 3 + c * 0.7 + r * 0.4) * h * 0.12;
          points.push(x, y);
        }
        for (let i = 16; i >= 0; i--) {
          const x = i * w / 16;
          const y = (0.08 + band * 0.26) * h + Math.sin(i / 16 * 3 + c * 0.7 + r * 0.4) * h * 0.12 + h * 0.13;
          points.push(x, y);
        }
        surface.graphics.drawPoly(0, 0, points, band % 2 ? "rgba(0,0,0,0.055)" : "rgba(255,255,255,0.075)");
      }
      for (let i = 0; i < 6; i++)
        surface.graphics.drawRect(0, i * h * 0.018, w, h * 0.018, `rgba(255,255,255,${0.065 * (1 - i / 6)})`);
      sprite.addChild(surface);
      const pulse = new Laya.Sprite();
      pulse.mouseEnabled = false;
      pulse.alpha = 0;
      pulse.graphics.drawRect(0, 0, w, h, "#fff6df");
      sprite.addChild(pulse);
      sprite.addChild(monsterFace(w, h));
      return { surface, pulse };
    }
    cancelAnimation() {
      Laya.timer.clearAll(this);
      this.animation = null;
    }
    destroy(destroyChild = true) {
      this.cancelAnimation();
      super.destroy(destroyChild);
    }
    restart() {
      this.cancelAnimation();
      this.rules.reset();
      this.refreshUI();
    }
    load(index) {
      this.cancelAnimation();
      this.index = index;
      this.rules = new Rules(levels[index]);
      this.refreshUI();
    }
    cell(r, c) {
      if (this.rules.busy)
        return;
      const old = this.rules.board.map((row) => row.slice());
      if (!this.rules.start(r, c))
        return;
      const cells = planWave(this.rules.changed, r, c);
      this.animation = { old, cells, start: Laya.timer.currTimer, end: Math.max(...cells.map((v) => v.start + v.duration)), color: this.rules.selected };
      for (const cell of cells)
        this.tiles[cell.r][cell.c].progress = -1;
      this.updateStatus();
      this.tickAnimation();
      Laya.timer.frameLoop(1, this, this.tickAnimation);
    }
    tickAnimation() {
      const animation = this.animation;
      if (!animation)
        return;
      const elapsed = Laya.timer.currTimer - animation.start;
      for (const cell of animation.cells) {
        if (elapsed < cell.start)
          continue;
        const tile = this.tiles[cell.r][cell.c], p = waveProgress(elapsed, cell);
        if (tile.progress === p)
          continue;
        tile.progress = p;
        this.paintTransition(tile, colors[animation.old[cell.r][cell.c]], colors[animation.color], p, cell);
        tile.label.text = names[p >= 0.5 ? animation.color : animation.old[cell.r][cell.c]];
        const energy = Math.sin(Math.PI * p);
        tile.pulse.alpha = energy * energy * 0.12;
        tile.surface.pos(Math.sin(p * Math.PI * 2) * 2, energy * 2);
        tile.surface.alpha = 1 - energy * 0.08;
      }
      if (elapsed >= animation.end) {
        this.cancelAnimation();
        this.rules.finish();
        this.updateStatus();
      }
    }
    // A directional, slightly uneven paint front. Draws only inside the original tile bounds.
    paintTransition(tile, oldColor, newColor, p, cell) {
      const g = tile.sprite.graphics, w = tile.sprite.width, h = tile.sprite.height;
      g.clear();
      g.drawRect(0, 0, w, h, p >= 1 ? newColor : oldColor);
      if (p <= 0 || p >= 1)
        return;
      const front = paintFront(w, h, p, cell);
      g.drawPoly(0, 0, front.fill, newColor);
      g.drawLines(0, 0, front.edge, "rgba(255,245,211,0.22)", Math.min(w, h) * 0.11);
      g.drawLines(0, 0, front.edge, "rgba(255,255,240,0.9)", Math.min(w, h) * 0.035);
    }
    updateStatus() {
      this.movesText.text = `目标：${names[this.rules.level.target]}色   ·   剩余 ${this.rules.moves} 步`;
      this.statusText.text = this.rules.busy ? "变装接力中…" : this.rules.result === "win" ? "成功！全员完成变装" : this.rules.result === "fail" ? "步数用完 · 可撤销或重来" : "先选颜色，再点任意同色队伍";
      this.statusText.color = this.rules.result === "fail" ? "#ffb3b3" : "#e5edff";
    }
    refreshUI(board = this.rules.board) {
      while (this.numChildren)
        this.getChildAt(0).destroy(true);
      this.tiles = [];
      this.graphics.clear();
      this.graphics.drawRect(0, 0, 600, 1e3, "#171d36");
      this.text("怪兽变装派对", 20, 30, 560, 36);
      this.text("V0.1  /  小角怪变装排练", 20, 82, 560, 18, "#a8b4d5");
      levels.forEach((l, i) => this.button(`样板 ${i + 1}`, 24 + i * 190, 132, 172, 48, i === this.index ? "#6575b7" : "#303951", () => this.load(i)));
      this.text(this.rules.level.name, 20, 207, 560, 28);
      this.movesText = this.text("", 20, 257, 560, 26);
      this.text(this.rules.level.purpose, 30, 312, 540, 20, "#b8c5e4");
      const rows = board.length, cols = board[0].length, size = Math.min(112, 520 / cols, 320 / rows), left = (600 - cols * size) / 2, top = 400 + (320 - rows * size) / 2;
      board.forEach((row, r) => {
        this.tiles[r] = [];
        row.forEach((color, c) => {
          const sprite = this.button(names[color], left + c * size + 1.5, top + r * size + 1.5, size - 3, size - 3, colors[color], () => this.cell(r, c), false, false);
          const label = sprite.getChildAt(0);
          label.visible = false;
          const effect = this.styleTile(sprite, r, c);
          this.tiles[r][c] = __spreadValues({ sprite, label, progress: -1 }, effect);
        });
      });
      this.statusText = this.text("", 20, 742, 560, 24);
      this.updateStatus();
      ["R", "Y", "B", "G"].forEach((c, i) => this.button(names[c], 36 + i * 135, 810, 120, 58, colors[c], () => {
        if (this.rules.busy)
          return;
        this.rules.select(c);
        this.refreshUI();
      }, this.rules.selected === c));
      this.button("撤销", 50, 903, 230, 56, "#343f60", () => {
        if (this.rules.busy)
          return;
        this.rules.undo();
        this.refreshUI();
      });
      this.button("重来", 320, 903, 230, 56, "#343f60", () => this.restart());
    }
  };
  __name(_PartyView, "PartyView");
  var PartyView = _PartyView;

  // src/Layout.ts
  function fitPortrait(width, height) {
    const scale = Math.min(width / 600, height / 1e3);
    return { scale, x: (width - 600 * scale) / 2, y: (height - 1e3 * scale) / 2 };
  }
  __name(fitPortrait, "fitPortrait");

  // src/MountParty.ts
  function mountParty() {
    Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
    Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
    const view = new PartyView();
    const resize = /* @__PURE__ */ __name(() => {
      const fit = fitPortrait(Laya.stage.width, Laya.stage.height);
      view.scale(fit.scale, fit.scale);
      view.pos(fit.x, fit.y);
    }, "resize");
    Laya.stage.addChild(view);
    Laya.stage.on(Laya.Event.RESIZE, view, resize);
    resize();
    return { view, dispose: () => {
      Laya.stage.off(Laya.Event.RESIZE, view, resize);
      view.destroy(true);
    } };
  }
  __name(mountParty, "mountParty");

  // src/Main.ts
  var { regClass } = Laya;
  var Main = class extends Laya.Script {
    onStart() {
      Laya.stage.bgColor = "#171d36";
      this.party = mountParty();
    }
    onDestroy() {
      var _a;
      (_a = this.party) == null ? void 0 : _a.dispose();
    }
  };
  __name(Main, "Main");
  Main = __decorateClass([
    regClass("7bad1742-6eed-4d8d-81c0-501dc5bf03d6", "../src/Main.ts")
  ], Main);
})();
//# sourceMappingURL=bundle.scene.js.map
