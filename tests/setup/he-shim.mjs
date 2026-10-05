// `he` is a CommonJS/UMD package; Next.js's bundler allows `import { decode } from "he"`,
// Node's ESM loader doesn't. Test-only re-export so lib/woocommerce.ts loads under node --test.
import he from "he";

export const decode = he.decode;
export const encode = he.encode;
export default he;
