import { Project, SyntaxKind } from "ts-morph";
import { METHOD_PERMISSIONS, NAMESPACE_BY_CLASS } from "../../dist/index.mjs";

const DEFAULT_INCLUDE = ["src/**/*.{ts,tsx,js,jsx,mts,cts}"];

function scan(opts) {
  const project = new Project({
    tsConfigFilePath: opts.tsConfigFilePath,
    skipAddingFilesFromTsConfig: !!opts.include,
  });
  if (opts.include) project.addSourceFilesAtPaths(opts.include);

  const used = new Set();
  const extras = new Set();

  for (const sf of project.getSourceFiles()) {
    if (sf.getFilePath().includes("node_modules")) continue;
    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression();
      if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;
      const method = expr.getLastChildByKind(SyntaxKind.Identifier);
      const methodName = method?.getText();
      const inner = expr.getExpression();
      if (!methodName) continue;

      let ns = resolveNamespace(inner);
      if (!ns) continue;
      const key = `${ns}.${methodName}`;
      if (key in METHOD_PERMISSIONS) used.add(key);
    }
  }
  for (const key of used) {
    const p = METHOD_PERMISSIONS[key];
    if (p) extras.add(p);
  }
  return { used, permissions: [...extras].sort() };
}

function resolveNamespace(inner) {
  let symName;
  try {
    symName = inner.getType().getSymbol()?.getName();
  } catch {
    symName = undefined;
  }
  if (symName && NAMESPACE_BY_CLASS[symName])
    return NAMESPACE_BY_CLASS[symName];
  if (inner.getKind() === SyntaxKind.PropertyAccessExpression) {
    const prop = inner.getLastChildByKind(SyntaxKind.Identifier)?.getText();
    if (prop && Object.values(NAMESPACE_BY_CLASS).includes(prop)) return prop;
  }
  if (inner.getKind() === SyntaxKind.Identifier) {
    const name = inner.getText();
    if (Object.values(NAMESPACE_BY_CLASS).includes(name)) return name;
  }
  return null;
}

export default function roturPermissions(options = {}) {
  const tsConfigFilePath = options.tsConfigFilePath ?? "tsconfig.json";
  const include = options.include ?? DEFAULT_INCLUDE;
  const extra = options.extraPermissions ?? [];
  let computed = [];

  return {
    name: "rotur-permissions",
    enforce: "pre",
    config() {
      const { permissions } = scan({ tsConfigFilePath, include });
      const merged = new Set([...permissions, ...extra]);
      computed = merged.has("full") ? ["full"] : [...merged].sort();
      if (options.verbose) {
        console.log(
          `[rotur-permissions] ${computed.length} permission(s): ${computed.join(", ")}`,
        );
      }
      return {
        define: {
          __ROTUR_REQUIRES__: JSON.stringify(computed),
        },
      };
    },
    getComputedPermissions() {
      return computed;
    },
  };
}
