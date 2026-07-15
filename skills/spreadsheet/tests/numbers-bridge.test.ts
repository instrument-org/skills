import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertNumbers } from "../scripts/numbers-bridge.ts";

function temporaryPath(extension: string) {
  return path.join(
    os.tmpdir(),
    `numbers-bridge-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
}

describe("convertNumbers", () => {
  it("round-trips CSV data through an Apple Numbers file", async () => {
    const csvPath = temporaryPath(".csv");
    const numbersPath = temporaryPath(".numbers");
    const jsonPath = temporaryPath(".json");
    await writeFile(csvPath, "Name,Score\nAlice,95\nBob,82\n", "utf-8");

    await convertNumbers({ inputPath: csvPath, outputPath: numbersPath });
    await convertNumbers({ inputPath: numbersPath, outputPath: jsonPath });

    expect(JSON.parse(await readFile(jsonPath, "utf-8"))).toEqual([
      { Name: "Alice", Score: 95 },
      { Name: "Bob", Score: 82 },
    ]);
  });
});
