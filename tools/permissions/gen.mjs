#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { Project, SyntaxKind } from "ts-morph";

const API_DIR = resolve(process.argv[2] || join(homedir(), "api"));
const SDK_ROOT = resolve(new URL("../..", import.meta.url).pathname);

function read(p) {
  if (!existsSync(p)) {
    console.error(`Missing source: ${p}`);
    process.exit(1);
  }
  return readFileSync(p, "utf8");
}

const tokensGo = read(join(API_DIR, "tokens.go"));
const permConst = {};
for (const m of tokensGo.matchAll(
  /(\bPerm\w+)\s+TokenPermission\s*=\s*"([^"]+)"/g,
)) {
  permConst[m[1]] = m[2];
}

const mainGo = read(join(API_DIR, "main.go"));
const routes = new Map();
const groupVar = {};
for (const m of mainGo.matchAll(/(\w+)\s*:=\s*r\.Group\("([^"]*)"\)/g)) {
  groupVar[m[1]] = m[2];
}

function norm(path) {
  return path
    .split("?")[0]
    .split("/")
    .map((seg) => (seg.startsWith(":") || seg.startsWith("*") ? "*" : seg))
    .join("/")
    .replace(/\/$/, "");
}

const ROUTE_RE = /(\br|\w+)\.(GET|POST|PUT|PATCH|DELETE)\("([^"]*)"([^\n]*)\)/g;
for (const m of mainGo.matchAll(ROUTE_RE)) {
  const [, recv, verb, rawPath, rest] = m;
  const prefix = recv === "r" ? "" : (groupVar[recv] ?? null);
  if (prefix === null) continue;
  const full = prefix + rawPath || "/";
  const permMatch = rest.match(/requirePermission\((Perm\w+)\)/);
  let perm = permMatch ? (permConst[permMatch[1]] ?? null) : null;
  if (!perm && /requireMainToken\(/.test(rest)) perm = "full";
  routes.set(`${verb} ${norm(full)}`, perm);
}

const project = new Project({
  tsConfigFilePath: join(SDK_ROOT, "tsconfig.json"),
});
project.addSourceFilesAtPaths(join(SDK_ROOT, "src/**/*.ts"));

const sourceFiles = project
  .getSourceFiles()
  .filter((sf) => sf.getFilePath().includes("/src/"));

let rotur;
for (const sf of sourceFiles) {
  const found = sf.getClass("Rotur");
  if (found) {
    rotur = found;
    break;
  }
}
if (!rotur) {
  console.error("Could not find the Rotur class in src/");
  process.exit(1);
}

const classToProp = {};
for (const prop of rotur.getProperties()) {
  const init = prop.getInitializer();
  if (!init) continue;
  const cm = init.getText().match(/new\s+(\w+Namespace)\(/);
  if (cm) classToProp[cm[1]] = prop.getName();
}

const VERB_BY_CALL = {
  $get: "GET",
  $post: "POST",
  $postQuery: "POST",
  $patch: "PATCH",
  $del: "DELETE",
  $delQuery: "DELETE",
};

function pathPatternFromArg(arg) {
  if (arg.getKind() === SyntaxKind.StringLiteral) {
    return norm(arg.getLiteralText());
  }
  if (
    arg.getKind() === SyntaxKind.TemplateExpression ||
    arg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    let raw = arg.getText().slice(1, -1).split("?")[0];
    raw = raw.replace(/\$\{[^}]*\}/g, "\0");
    return norm(
      raw
        .split("/")
        .map((seg) => (seg.includes("\0") ? "*" : seg))
        .join("/"),
    );
  }
  return null;
}

const manifest = {};
const unmatched = [];

const allClasses = sourceFiles.flatMap((sf) => sf.getClasses());
for (const cls of allClasses) {
  const cname = cls.getName();
  if (!cname || !cname.endsWith("Namespace")) continue;
  const ns = classToProp[cname];
  if (!ns) continue;
  for (const method of cls.getMethods()) {
    const mname = method.getName();
    const calls = method
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((c) => {
        const ex = c.getExpression();
        return (
          ex.getKind() === SyntaxKind.PropertyAccessExpression &&
          ex.getText().startsWith("this.$")
        );
      });
    if (calls.length === 0) continue;

    let perm = undefined;
    for (const call of calls) {
      const fn = call.getExpression().getText().replace("this.", "");
      const verb = VERB_BY_CALL[fn];
      if (!verb) continue;
      const args = call.getArguments();
      const pat = args[0] ? pathPatternFromArg(args[0]) : null;
      if (pat == null) continue;
      const key = `${verb} ${pat}`;
      if (routes.has(key)) {
        const p = routes.get(key);
        if (p) {
          perm = p;
          break;
        }
        if (perm === undefined) perm = null;
      } else {
        if (perm === undefined) perm = null;
        unmatched.push(`${ns}.${mname} -> ${key}`);
      }
    }
    if (perm !== undefined) manifest[`${ns}.${mname}`] = perm;
  }
}

const sorted = Object.keys(manifest).sort();
const entries = sorted
  .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(manifest[k])},`)
  .join("\n");

const classEntries = Object.keys(classToProp)
  .sort()
  .map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(classToProp[c])},`)
  .join("\n");

const out = `export const METHOD_PERMISSIONS: Record<string, string | null> = {
${entries}
};

export const NAMESPACE_BY_CLASS: Record<string, string> = {
${classEntries}
};

export function resolvePermissions(usedMethods: Iterable<string>): string[] {
  const set = new Set<string>();
  for (const m of usedMethods) {
    const p = METHOD_PERMISSIONS[m];
    if (p) set.add(p);
  }
  if (set.has("full")) return ["full"];
  return [...set].sort();
}
`;

writeFileSync(join(SDK_ROOT, "src/permissions.ts"), out);

const withPerm = sorted.filter((k) => manifest[k]).length;
console.log(
  `Wrote src/permissions.ts: ${sorted.length} methods (${withPerm} with permission).`,
);
if (unmatched.length) {
  const uniq = [...new Set(unmatched)];
  console.warn(`\n${uniq.length} unmatched call(s) (treated as public):`);
  for (const u of uniq.slice(0, 40)) console.warn("  " + u);
}
