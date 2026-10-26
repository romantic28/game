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

// game/src/Layout.ts
var Layout_exports = {};
__export(Layout_exports, {
  fitPortrait: () => fitPortrait
});
module.exports = __toCommonJS(Layout_exports);
function fitPortrait(width, height) {
  const scale = Math.min(width / 600, height / 1e3);
  return { scale, x: (width - 600 * scale) / 2, y: (height - 1e3 * scale) / 2 };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fitPortrait
});
