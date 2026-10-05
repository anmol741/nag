// Pure certification-upload validation — no imports, unit tested in
// tests/upload.test.ts. The registration route runs this on the server
// before anything is forwarded to WordPress, and the WordPress bridge
// plugin re-checks the same signatures independently (defense in depth).
//
// A file is accepted only when ALL of these agree: its extension, the
// browser-declared MIME type, and the file's actual leading bytes ("magic
// number"). The magic-byte check is the one that matters — extension and
// MIME type are both attacker-controlled.

/**
 * Netlify's synchronous functions cap request bodies at ~6 MB, and the
 * file travels inside a multipart form, so 4 MB leaves comfortable room
 * for the other fields and multipart overhead.
 */
export const MAX_CERTIFICATION_BYTES = 4 * 1024 * 1024;

export type CertificationKind = "pdf" | "jpeg" | "png" | "webp" | "heic";

interface KindRule {
  extensions: string[];
  mimeTypes: string[];
  /** Canonical MIME type stored/served for this kind. */
  canonicalMime: string;
}

const RULES: Record<CertificationKind, KindRule> = {
  pdf: { extensions: ["pdf"], mimeTypes: ["application/pdf"], canonicalMime: "application/pdf" },
  jpeg: { extensions: ["jpg", "jpeg"], mimeTypes: ["image/jpeg", "image/jpg", "image/pjpeg"], canonicalMime: "image/jpeg" },
  png: { extensions: ["png"], mimeTypes: ["image/png"], canonicalMime: "image/png" },
  webp: { extensions: ["webp"], mimeTypes: ["image/webp"], canonicalMime: "image/webp" },
  // iPhone camera default. Some browsers report an empty MIME type for it.
  heic: { extensions: ["heic", "heif"], mimeTypes: ["image/heic", "image/heif", ""], canonicalMime: "image/heic" },
};

/** Value for an <input type="file" accept="…">. Client hint only — never trusted. */
export const CERTIFICATION_ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  if (bytes.length < start + length) return "";
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** Identifies the real file type from its leading bytes, or null if it isn't one of the accepted kinds. */
export function detectCertificationKind(bytes: Uint8Array): CertificationKind | null {
  if (ascii(bytes, 0, 5) === "%PDF-") return "pdf";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 4, 4) === "ftyp" && ["heic", "heix", "heif", "mif1", "msf1", "hevc"].includes(ascii(bytes, 8, 4))) return "heic";
  return null;
}

export function fileExtension(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

export type CertificationValidation =
  | { ok: true; kind: CertificationKind; mimeType: string; extension: string }
  | { ok: false; error: string };

export function validateCertificationFile(input: { name: string; type: string; size: number; bytes: Uint8Array }): CertificationValidation {
  if (input.size <= 0 || input.bytes.length === 0) {
    return { ok: false, error: "Please upload your certification document or photo." };
  }
  if (input.size > MAX_CERTIFICATION_BYTES || input.bytes.length > MAX_CERTIFICATION_BYTES) {
    return { ok: false, error: "The file is too large. Please upload a file under 4 MB." };
  }

  const kind = detectCertificationKind(input.bytes);
  if (!kind) {
    return { ok: false, error: "Please upload a PDF, JPG, PNG, WEBP or HEIC file." };
  }

  const rule = RULES[kind];
  const extension = fileExtension(input.name);
  if (!rule.extensions.includes(extension)) {
    return { ok: false, error: "The file name doesn't match its contents. Please upload a PDF, JPG, PNG, WEBP or HEIC file." };
  }
  const declared = (input.type || "").toLowerCase();
  if (!rule.mimeTypes.includes(declared)) {
    return { ok: false, error: "The file type doesn't match its contents. Please upload a PDF, JPG, PNG, WEBP or HEIC file." };
  }

  return { ok: true, kind, mimeType: rule.canonicalMime, extension };
}

/** Strips a client-supplied filename to a short, safe display name (no paths, no control characters). Used only as a label — the stored file always gets a random server-generated name. */
export function safeDisplayFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[^\w.\- ()]/g, "_").replace(/\s+/g, " ").trim();
  return (cleaned || "certification").slice(0, 100);
}
