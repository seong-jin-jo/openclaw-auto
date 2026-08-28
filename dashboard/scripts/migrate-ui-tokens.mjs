#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SOURCE_EXTENSIONS = /\.(?:ts|tsx)$/;
const TOKEN_PATTERN = /[A-Za-z0-9_:[\]./%(),-]+/g;

const SPACE_NAMES = new Map([
  ["0", "none"],
  ["0.5", "micro"],
  ["1", "micro"],
  ["1.5", "stack-tight"],
  ["2", "stack-tight"],
  ["2.5", "stack"],
  ["3", "stack"],
  ["4", "pad-inset"],
  ["5", "stack-section"],
  ["6", "stack-section"],
  ["7", "region"],
  ["8", "region"],
  ["9", "region"],
  ["10", "wide"],
  ["11", "wide"],
  ["12", "wide"],
  ["14", "wide"],
  ["16", "wide"],
  ["20", "wide"],
  ["24", "wide"],
]);

const TYPE_NAMES = new Map([
  ["xs", "caption"],
  ["sm", "body-sm"],
  ["base", "body"],
  ["lg", "lead"],
  ["xl", "subheading"],
  ["2xl", "heading"],
  ["3xl", "display"],
  ["4xl", "display"],
  ["5xl", "display"],
  ["6xl", "display"],
  ["[12px]", "caption"],
  ["[13px]", "body-sm"],
  ["[15px]", "body"],
]);

const COLOR_ROLES = {
  slate: "muted", gray: "muted", zinc: "muted", neutral: "muted", stone: "muted",
  red: "danger", orange: "warning", amber: "warning", yellow: "warning",
  lime: "success", green: "success", emerald: "success", teal: "success",
  cyan: "accent", sky: "accent", blue: "accent", indigo: "accent",
  violet: "accent", purple: "accent", fuchsia: "accent", pink: "accent", rose: "danger",
};

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return SOURCE_EXTENSIONS.test(entry.name) ? [target] : [];
  });
}

function migrateCore(core) {
  const spacing = core.match(/^(-?)(p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy])-(\d+(?:\.\d+)?)$/);
  if (spacing) {
    const name = SPACE_NAMES.get(spacing[3]);
    if (name) return `${spacing[1]}${spacing[2]}-${name}`;
  }
  if (/^(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy])-\[2px\]$/.test(core)) {
    return core.replace("[2px]", "micro");
  }

  const type = core.match(/^text-(.+)$/);
  if (type && TYPE_NAMES.has(type[1])) return `text-${TYPE_NAMES.get(type[1])}`;

  const color = core.match(/^(text|bg|border|ring|outline|shadow|from|via|to|fill|stroke|decoration)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(\/\d+)?$/);
  if (color) return `${color[1]}-${COLOR_ROLES[color[2]]}${color[3] || ""}`;

  const monochrome = core.match(/^(text|bg|border|ring|outline|from|via|to|fill|stroke|decoration)-(black|white)(\/\d+)?$/);
  if (monochrome) {
    const role = monochrome[1] === "bg" && monochrome[2] === "white" ? "surface"
      : monochrome[1] === "text" && monochrome[2] === "black" ? "text"
        : monochrome[1] === "text" && monochrome[2] === "white" ? "player-text"
          : monochrome[2] === "black" ? "player-surface" : "player-text";
    return `${monochrome[1]}-${role}${monochrome[3] || ""}`;
  }

  const radius = core.match(/^rounded((?:-[trbl]{1,2})?)(?:-(sm|md|lg|xl|2xl|3xl|full))?$/);
  if (radius) {
    const size = radius[2] || "default";
    const role = size === "full" ? "pill" : size === "sm" || size === "default" ? "chip" : size === "md" || size === "lg" ? "control" : "surface";
    return `rounded${radius[1]}-${role}`;
  }
  if (/^shadow-\[(?!var\()[^\]]+\]$/.test(core)) return "shadow-floating";
  return core;
}

export function migrateSource(source) {
  return source.replace(TOKEN_PATTERN, (token) => {
    const parts = token.split(":");
    const core = parts.pop();
    const migrated = migrateCore(core);
    return [...parts, migrated].join(":");
  });
}

const target = path.resolve(process.argv[2] || path.resolve(process.cwd(), "src"));
const write = process.argv.includes("--write");
let filesChanged = 0;
for (const file of sourceFiles(target)) {
  const before = fs.readFileSync(file, "utf8");
  const after = migrateSource(before);
  if (after === before) continue;
  filesChanged += 1;
  if (write) fs.writeFileSync(file, after);
}
process.stdout.write(`${JSON.stringify({ target, write, filesChanged })}\n`);
