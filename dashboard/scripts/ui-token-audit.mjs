#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_EXTENSIONS = /\.(?:ts|tsx)$/;
const TOKEN_PATTERN = /[A-Za-z0-9_:[\]./%(),-]+/g;
const CLASS_PATTERN = /className=(?:"([^"]*)"|`([^`]*)`|\{`([^`]*)`\})/g;

const RULES = [
  {
    category: "spacing",
    pattern: /^-?(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy])-(?:\d+(?:\.\d+)?|\[(?!var\()[^\]]+\])$/i,
  },
  {
    category: "typography",
    pattern: /^text-(?:xs|sm|base|lg|xl|[2-9]xl|\[(?!var\()[^\]]+\])$/i,
  },
  {
    category: "color",
    pattern: /^(?:text|bg|border|ring|outline|shadow|from|via|to|fill|stroke|decoration)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white)(?:\/\d+)?$/i,
  },
  {
    category: "radius",
    pattern: /^rounded(?:-[trbl]{1,2})?(?:-(?:sm|md|lg|xl|2xl|3xl|full|\[(?!var\()[^\]]+\]))?$/i,
  },
  {
    category: "elevation",
    pattern: /^shadow-\[(?!var\()[^\]]+\]$/i,
  },
];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return SOURCE_EXTENSIONS.test(entry.name) ? [target] : [];
  });
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

export function auditSource(source, file = "fixture.tsx") {
  const tokens = Array.from(source.matchAll(TOKEN_PATTERN));
  const directValueViolations = tokens.flatMap((match) => {
    const original = match[0];
    const value = original.split(":").at(-1) ?? original;
    const rule = RULES.find(({ pattern }) => pattern.test(value));
    if (!rule) return [];
    return [{
      category: rule.category,
      file,
      line: lineNumber(source, match.index ?? 0),
      value: original,
    }];
  });
  const contrastViolations = Array.from(source.matchAll(CLASS_PATTERN)).flatMap((match) => {
    const value = match[1] || match[2] || match[3] || "";
    const accentMismatch = value.includes("text-accent-fg") && !value.includes("bg-accent");
    const statusMismatch = value.includes("text-status-fg") && !/(?:bg-(?:success|warning|danger))/.test(value);
    if (!accentMismatch && !statusMismatch) return [];
    return [{
      category: "contrast",
      file,
      line: lineNumber(source, match.index ?? 0),
      value,
    }];
  });
  return [...directValueViolations, ...contrastViolations];
}

export function auditDirectory(directory) {
  const root = path.resolve(directory);
  const violations = sourceFiles(root).flatMap((file) => auditSource(
    fs.readFileSync(file, "utf8"),
    path.relative(root, file),
  ));
  const categories = [...RULES.map(({ category }) => category), "contrast"];
  const counts = Object.fromEntries(categories.map((category) => [
    category,
    violations.filter((violation) => violation.category === category).length,
  ]));
  return {
    root,
    total: violations.length,
    counts,
    violations,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  const target = process.argv[2] || path.resolve(process.cwd(), "src");
  const report = auditDirectory(target);
  const compact = process.argv.includes("--compact");
  process.stdout.write(`${JSON.stringify(report, null, compact ? 0 : 2)}\n`);
  if (process.argv.includes("--check") && report.total > 0) process.exitCode = 1;
}
