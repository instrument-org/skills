import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { generateBarcode } from "../scripts/generate-barcode.ts";
import { readBarcode } from "../scripts/read-barcode.ts";

const PNG_MAGIC_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

let qrCodePath: string;
let code128Path: string;

beforeAll(async () => {
  qrCodePath = path.join(os.tmpdir(), "scan-barcodes-test-qr.png");
  await generateBarcode({
    content: "https://example.com",
    format: "QRCode",
    outputPath: qrCodePath,
  });

  code128Path = path.join(os.tmpdir(), "scan-barcodes-test-code128.png");
  await generateBarcode({
    content: "ABC-1234",
    format: "Code128",
    outputPath: code128Path,
  });
});

describe("generateBarcode", () => {
  it("generates a QR code PNG", async () => {
    const outputPath = path.join(os.tmpdir(), "gen-qr.png");
    const result = await generateBarcode({
      content: "hello world",
      format: "QRCode",
      outputPath,
    });

    expect(result.outputPath).toBe(outputPath);
    const file = await fs.readFile(outputPath);
    expect(file.subarray(0, 8).equals(PNG_MAGIC_BYTES)).toBe(true);
  });

  it("generates a Code128 barcode PNG", async () => {
    const outputPath = path.join(os.tmpdir(), "gen-code128.png");
    const result = await generateBarcode({
      content: "12345678",
      format: "Code128",
      outputPath,
    });

    expect(result.outputPath).toBe(outputPath);
    const file = await fs.readFile(outputPath);
    expect(file.subarray(0, 8).equals(PNG_MAGIC_BYTES)).toBe(true);
  });

  it("respects the scale option", async () => {
    const small = path.join(os.tmpdir(), "gen-scale-2.png");
    const large = path.join(os.tmpdir(), "gen-scale-8.png");

    await generateBarcode({ content: "test", outputPath: small, scale: 2 });
    await generateBarcode({ content: "test", outputPath: large, scale: 8 });

    const smallStat = await fs.stat(small);
    const largeStat = await fs.stat(large);
    expect(largeStat.size).toBeGreaterThan(smallStat.size);
  });

  it("throws on an invalid format", async () => {
    const outputPath = path.join(os.tmpdir(), "gen-invalid.png");
    await expect(
      generateBarcode({ content: "test", format: "NotAFormat", outputPath }),
    ).rejects.toThrow();
  });
});

describe("readBarcode", () => {
  it("reads a QR code and returns its text", async () => {
    const results = await readBarcode({ imagePath: qrCodePath });

    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("https://example.com");
    expect(results[0].format).toBe("QRCode");
  });

  it("reads a Code128 barcode and returns its text", async () => {
    const results = await readBarcode({ imagePath: code128Path });

    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("ABC-1234");
    expect(results[0].format).toBe("Code128");
  });

  it("returns empty array when no barcode is found", async () => {
    const blankPath = path.join(os.tmpdir(), "blank.png");
    const blank = Buffer.alloc(100 * 100 * 4, 255);
    await fs.writeFile(blankPath, blank);

    const results = await readBarcode({ imagePath: blankPath, limit: 0 });
    expect(results).toHaveLength(0);
  });

  it("limits results with the limit option", async () => {
    const results = await readBarcode({ imagePath: qrCodePath, limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("respects the formats filter", async () => {
    const results = await readBarcode({
      formats: ["QRCode"],
      imagePath: qrCodePath,
    });
    expect(results).toHaveLength(1);
    expect(results[0].format).toBe("QRCode");
  });

  it("returns empty when format filter excludes the barcode type", async () => {
    const results = await readBarcode({
      formats: ["DataMatrix"],
      imagePath: qrCodePath,
      limit: 0,
    });
    expect(results).toHaveLength(0);
  });
});
