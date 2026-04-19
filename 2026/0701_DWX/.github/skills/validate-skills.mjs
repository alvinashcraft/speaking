#!/usr/bin/env node
// Validates project Copilot skills against the agentskills.io spec.
// Mirrors the rules in github/awesome-copilot's eng/validate-skills.mjs.
//
// Usage:  node .github/skills/validate-skills.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = __dirname;

const NAME_MIN = 1;
const NAME_MAX = 64;
const DESC_MIN = 10;
const DESC_MAX = 1024;
const MAX_ASSET_BYTES = 5 * 1024 * 1024;

function parseFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const meta = {};
  const lines = match[1].split(/\r?\n/);
  let key = null;
  let buf = "";

  const flush = () => {
    if (key === null) return;
    let v = buf.trim();
    if ((v.startsWith("'") && v.endsWith("'")) ||
        (v.startsWith("\"") && v.endsWith("\""))) {
      v = v.slice(1, -1);
    }
    meta[key] = v;
    buf = "";
  };

  for (const line of lines) {
    const m = line.match(/^([a-zA-Z_][\w-]*):\s?(.*)$/);
    if (m) {
      flush();
      key = m[1];
      buf = m[2];
    } else if (key !== null) {
      buf += " " + line.trim();
    }
  }
  flush();
  return meta;
}

function validate(folder) {
  const folderPath = path.join(SKILLS_DIR, folder);
  const skillFile = path.join(folderPath, "SKILL.md");
  const errors = [];

  if (!fs.existsSync(skillFile)) {
    errors.push("Missing SKILL.md (filename is case-sensitive on Linux/macOS)");
    return errors;
  }

  const meta = parseFrontmatter(skillFile);
  if (!meta) {
    errors.push("Failed to parse YAML frontmatter");
    return errors;
  }

  const { name, description } = meta;

  if (!name || typeof name !== "string") {
    errors.push("name: required string");
  } else {
    if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push("name: must contain only lowercase letters, numbers, and hyphens");
    }
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      errors.push(`name: must be ${NAME_MIN}-${NAME_MAX} chars (got ${name.length})`);
    }
    if (name !== folder) {
      errors.push(`Folder "${folder}" does not match skill name "${name}"`);
    }
  }

  if (!description || typeof description !== "string") {
    errors.push("description: required string");
  } else if (description.length < DESC_MIN) {
    errors.push(`description: must be at least ${DESC_MIN} chars (got ${description.length})`);
  } else if (description.length > DESC_MAX) {
    errors.push(`description: must not exceed ${DESC_MAX} chars (got ${description.length})`);
  }

  // Bundled-asset size check (assets referenced via [text](path) in SKILL.md)
  const body = fs.readFileSync(skillFile, "utf8");
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(body)) !== null) {
    const ref = m[1].split("#")[0];
    if (/^https?:/.test(ref) || ref.startsWith("/") || ref === "") continue;
    const assetPath = path.join(folderPath, ref);
    if (!fs.existsSync(assetPath) || fs.statSync(assetPath).isDirectory()) continue;
    const sz = fs.statSync(assetPath).size;
    if (sz > MAX_ASSET_BYTES) {
      errors.push(`Asset "${ref}" exceeds 5 MB (${(sz / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  return errors;
}

const folders = fs
  .readdirSync(SKILLS_DIR)
  .filter((f) => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());

let failed = 0;
const seen = new Set();

console.log(`Validating ${folders.length} skill folder(s) in ${SKILLS_DIR}\n`);

for (const folder of folders) {
  const errors = validate(folder);
  if (errors.length === 0) {
    const meta = parseFrontmatter(path.join(SKILLS_DIR, folder, "SKILL.md"));
    if (meta && seen.has(meta.name)) {
      console.error(`❌ ${folder}: duplicate skill name "${meta.name}"`);
      failed++;
    } else {
      if (meta) seen.add(meta.name);
      console.log(`✅ ${folder}`);
    }
  } else {
    console.error(`❌ ${folder}`);
    for (const e of errors) console.error(`   - ${e}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} skill(s) failed validation`);
  process.exit(1);
}
console.log(`\n🎉 All ${folders.length} skill(s) valid`);
