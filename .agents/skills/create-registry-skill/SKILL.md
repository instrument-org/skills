---
name: create-registry-skill
description: Guide for creating effective Agent Skills. Use when you want to create, write, or author a new skill, or asks about skill structure, best practices, or SKILL.md format.
---

# Creating Registry Skills

Skills live in `skills/` and are installed into the workspace on demand. Each skill has scripts the agent runs via CLI.

## Directory Layout

```
skills/skill-name/
├── SKILL.template.md     # Source of truth — contains {{GENERATED_SCRIPT_DOCS}}
├── SKILL.md              # Generated — never edit directly
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts      # Required — without this, tests are skipped silently
└── scripts/
    └── my-script.ts
```

**`SKILL.md` is generated** from `SKILL.template.md` by running:

```bash
tsx scripts/generate-skill-md.ts --skill skill-name
```

Run this from the **workspace root** (not from inside the skill). The generator replaces `{{GENERATED_SCRIPT_DOCS}}` with documentation extracted from each script's JSDoc and CAC `--help` output. Always edit `SKILL.template.md`, never `SKILL.md`.

---

## SKILL.template.md

Keep it minimal — script docs are injected automatically:

```markdown
---
name: your-skill-name
description: "..."
---

# Your Skill Name

Brief one-liner about what this skill does.

## Scripts

Each script can also be used programmatically via its exported function.

{{GENERATED_SCRIPT_DOCS}}
```

---

## Writing Effective Descriptions

The description is the only thing the agent sees when deciding whether to load the skill. Max 1024 characters.

- **Focus on user intent**: "Use when the user wants to remove a background" beats "Runs RMBG-1.4 via ONNX."
- **Use imperative phrasing**: "Use when..." / "Activate when..."
- **List trigger scenarios** including cases where the user doesn't name the domain directly.
- **Disambiguate from similar skills** with negative signals if needed.

---

## Script Structure

Scripts use **CAC** for CLI parsing and export a named async function for programmatic use.

```typescript
/**
 * Brief description of what this script does
 * @note Optional note shown as a callout in the generated docs
 */
import { cac } from "cac";
import { pathToFileURL } from "node:url";

export async function doSomething({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath: string;
}) {
  // ...
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("my-script");
  cli.usage("<inputPath>");
  cli.option("--output <path>", "Output file path");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await doSomething({
    inputPath: resolve(args[0]),
    outputPath: resolve(options.output ?? "output.txt"),
  });

  console.log(`Saved to ${relative(process.cwd(), result.outputPath) || "."}`);
}
```

### What gets auto-generated

The generator extracts:

1. **Heading + description** — from the file-level JSDoc comment
2. **Exports** — TypeScript function signatures via the type checker
3. **CLI help** — from running the script with `--help` via CAC
4. **Notes** — from `@note` tags in the file-level JSDoc

So the only things you need to write manually in `SKILL.template.md` are the frontmatter and any context that isn't captured by scripts.

### Output paths

Always log paths **relative to `process.cwd()`**:

```typescript
import { relative, resolve } from "node:path";
const relOutput = relative(process.cwd(), resolve(outputPath)) || ".";
console.log(`Saved to ${relOutput}`);
```

### Resolving package-internal files (WASM, assets)

Use `createRequire` to resolve paths to files inside `node_modules` (e.g. `.wasm` binaries):

```typescript
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
const wasmPath = _require.resolve("some-package/file.wasm");
```

---

## Tests

Each skill needs a `tests/scripts.test.ts` and a `vitest.config.ts`. **Without `vitest.config.ts` the tests are silently skipped** by the root vitest workspace config (which globs `./skills/*/vitest.config.ts`).

### `vitest.config.ts` (copy exactly)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
  },
});
```

For test conventions and patterns, refer to an existing skill's `tests/scripts.test.ts` (e.g. `skills/charts` or `skills/sharp-images`).

---

## Summary Checklist

### Core Quality

- [ ] Description focuses on user intent, includes trigger scenarios, is under 1024 chars
- [ ] `SKILL.template.md` contains `{{GENERATED_SCRIPT_DOCS}}`
- [ ] `SKILL.md` is generated from workspace root — `pnpm tsx scripts/generate-skill-md.ts --skill skill-name`

### Files

- [ ] `tsconfig.json` (copy from another skill)
- [ ] `vitest.config.ts` (required — without it tests are silently skipped)
- [ ] `tests/scripts.test.ts`
- [ ] Dependencies in `package.json` + run `pnpm install` (requires `required_permissions: ["all"]` in sandbox)

### Scripts

- [ ] File-level JSDoc describes what the script does (becomes the heading description)
- [ ] Use `@note` tags for important caveats (rendered as callouts)
- [ ] Use **CAC** for CLI parsing, not `parseArgs`
- [ ] Export a named async function; guard CLI with `import.meta.url`
- [ ] Log output paths relative to `process.cwd()`
- [ ] Use `createRequire` to resolve package-internal files (e.g. WASM), not `import.meta.resolve`

### Tests

- [ ] `beforeAll` generates any fixtures the read-path tests depend on
- [ ] All outputs written to `os.tmpdir()`
- [ ] Tests pass: `cd skills/<name> && pnpm test`
