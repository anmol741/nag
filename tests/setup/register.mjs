// Test-only module resolution for `node --test` (no extra dependencies):
// - maps the "@/..." path alias (tsconfig "paths") to the project root
// - resolves extensionless relative imports to .ts/.tsx files
// Node 24 strips TypeScript types natively. Run with
// --conditions=react-server so `import "server-only"` resolves to its
// no-op server entry, as it does inside Next.js server code.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const candidates = ["", ".ts", ".tsx", "/index.ts"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "he" && !context.parentURL?.endsWith("/he-shim.mjs")) {
      return nextResolve(pathToFileURL(path.join(root, "tests", "setup", "he-shim.mjs")).href, context);
    }
    // next/server, next/headers, … are CommonJS files without an "exports" map.
    if (/^next\/[a-z-]+$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    let target = null;
    if (specifier.startsWith("@/")) {
      target = path.join(root, specifier.slice(2));
    } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:") && !path.extname(specifier)) {
      target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (target) {
      for (const suffix of candidates) {
        const file = target + suffix;
        if (suffix !== "" && existsSync(file)) return nextResolve(pathToFileURL(file).href, context);
        if (suffix === "" && path.extname(file) && existsSync(file)) return nextResolve(pathToFileURL(file).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
