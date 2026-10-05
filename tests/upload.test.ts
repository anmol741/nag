import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CERTIFICATION_BYTES, detectCertificationKind, safeDisplayFileName, validateCertificationFile } from "../lib/security/upload";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);
const HEIC = new Uint8Array([0, 0, 0, 0x18, ...Buffer.from("ftypheic"), 0, 0, 0, 0]);
const HTML = new Uint8Array(Buffer.from("<html><script>alert(1)</script></html>"));
const SVG = new Uint8Array(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'));
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

const file = (name: string, type: string, bytes: Uint8Array, size = bytes.length) => ({ name, type, size, bytes });

test("detects accepted formats by magic bytes", () => {
  assert.equal(detectCertificationKind(PDF), "pdf");
  assert.equal(detectCertificationKind(JPEG), "jpeg");
  assert.equal(detectCertificationKind(PNG), "png");
  assert.equal(detectCertificationKind(WEBP), "webp");
  assert.equal(detectCertificationKind(HEIC), "heic");
});

test("rejects HTML, SVG and executables regardless of name/type", () => {
  assert.equal(detectCertificationKind(HTML), null);
  assert.equal(validateCertificationFile(file("cert.pdf", "application/pdf", HTML)).ok, false);
  assert.equal(validateCertificationFile(file("cert.svg", "image/svg+xml", SVG)).ok, false);
  assert.equal(validateCertificationFile(file("cert.jpg", "image/jpeg", EXE)).ok, false);
});

test("accepts matching extension, MIME and contents", () => {
  const result = validateCertificationFile(file("My Cert.PDF", "application/pdf", PDF));
  assert.deepEqual(result, { ok: true, kind: "pdf", mimeType: "application/pdf", extension: "pdf" });
  assert.equal(validateCertificationFile(file("photo.jpeg", "image/jpeg", JPEG)).ok, true);
  assert.equal(validateCertificationFile(file("photo.heic", "", HEIC)).ok, true); // some browsers send no MIME for HEIC
});

test("rejects a real PDF renamed to .png, or with a wrong MIME type", () => {
  assert.equal(validateCertificationFile(file("cert.png", "image/png", PDF)).ok, false);
  assert.equal(validateCertificationFile(file("cert.pdf", "text/html", PDF)).ok, false);
  assert.equal(validateCertificationFile(file("cert", "application/pdf", PDF)).ok, false);
});

test("enforces size limits (empty and > 4 MB)", () => {
  assert.equal(validateCertificationFile(file("cert.pdf", "application/pdf", new Uint8Array(0))).ok, false);
  assert.equal(validateCertificationFile(file("cert.pdf", "application/pdf", PDF, MAX_CERTIFICATION_BYTES + 1)).ok, false);
  const big = new Uint8Array(MAX_CERTIFICATION_BYTES + 1);
  big.set(PDF);
  assert.equal(validateCertificationFile(file("cert.pdf", "application/pdf", big, PDF.length)).ok, false);
});

test("display names are stripped of paths and unsafe characters", () => {
  assert.equal(safeDisplayFileName("../../etc/passwd"), "passwd");
  assert.equal(safeDisplayFileName("C:\\Users\\me\\cert<script>.pdf"), "cert_script_.pdf");
  assert.equal(safeDisplayFileName(""), "certification");
  assert.ok(safeDisplayFileName("a".repeat(300)).length <= 100);
});
