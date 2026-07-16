---
name: create-registry-skill
description: Guide for creating effective Agent Skills. Use when you want to create, write, or author a new skill, or asks about skill structure, best practices, or SKILL.md format.
---

# Creating Registry Skills

Skills live in `skills/` and are installed into the workspace on demand. A
skill should teach the agent how to solve work in its domain. Scripts are
convenience tools for closed operations, not the skill's primary abstraction.

## Directory Layout

```
skills/skill-name/
├── SKILL.template.md     # Source of truth
├── SKILL.md              # Generated, never edit directly
├── reference.md          # Generated full CLI docs with a script index
├── package.json
└── scripts/
```

TypeScript skills add `pnpm-lock.yaml`, `tsconfig.json`, `vitest.config.ts`,
and `tests/scripts.test.ts`. Python skills add `pyproject.toml`, a committed
`uv.lock`, and `tests/test_scripts.py`.

**`SKILL.md` and optional `reference.md` are generated** from
`SKILL.template.md` by running:

```bash
tsx scripts/generate-skill-md.ts --skill skill-name
```

Run this from the **workspace root** (not from inside the skill). The generator
replaces `{{GENERATED_SCRIPT_INDEX}}` with concise script descriptions and
writes complete exports and CLI help to `reference.md`. Always edit
`SKILL.template.md`, never `SKILL.md` or generated `reference.md`.

---

## Design the skill as a recipe book

Start with the user's goal, then route between direct library use and bundled
scripts:

- Use direct library recipes for content, layout, data transformation,
  composition, and other work whose requirements vary by task.
- Keep scripts for bounded operations with a stable contract, such as listing
  an archive, extracting text, or applying one deterministic mutation.
- Command-first guidance is appropriate when the command is itself the best
  compositional API, such as FFmpeg or browser automation.
- Include a verification loop that tests the properties users care about. For
  visual artifacts, require rendering and inspection, not just file parsing.
- Explain consequential traps and fidelity boundaries, not every library API.

Python packages are available to task-local scripts through the task
virtualenv. TypeScript dependencies are isolated to the loaded skill package,
so custom TypeScript files that import them must be written inside that skill
directory and run by full path from the task root.

## SKILL.template.md

Prefer progressive disclosure. Keep recipes and routing in `SKILL.md`, then
generate complete script help into `reference.md`:

````markdown
---
name: your-skill-name
description: "..."
---

# Your Skill Name

State when to use direct library code and when to use a bundled script.

## Choose an approach

| Need                      | Approach                               |
| ------------------------- | -------------------------------------- |
| Custom or generative work | Write code using the installed library |
| Closed operation          | Use the matching bundled script        |

## Recipe: compose with the library

```python
# Small executable example using task-relative input and output paths.
```

## Script index

Read [`reference.md`](reference.md) for complete arguments.

{{GENERATED_SCRIPT_INDEX}}
````

Use `{{GENERATED_SCRIPT_DOCS}}` only when a skill has one very small script and
inline help is genuinely clearer than a secondary reference.

---

## Writing Effective Descriptions

The description is the only thing the agent sees when deciding whether to load the skill. Max 1024 characters.

- **Focus on user intent**: "Use when the user wants to remove a background" beats "Runs RMBG-1.4 via ONNX."
- **Use imperative phrasing**: "Use when..." / "Activate when..."
- **List trigger scenarios** including cases where the user doesn't name the domain directly.
- **Disambiguate from similar skills** with negative signals if needed.

---

## TypeScript Script Structure

TypeScript scripts use **CAC** for CLI parsing and export a named async
function for programmatic use.

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

For TypeScript scripts, the generator extracts:

1. **Heading + description** — from the file-level JSDoc comment
2. **Exports** — TypeScript function signatures via the type checker
3. **CLI help** — from running the script with `--help` via CAC
4. **Notes** — from `@note` tags in the file-level JSDoc

With `{{GENERATED_SCRIPT_INDEX}}`, the primary skill receives concise script
names and descriptions while full exports, CLI help, and notes are written to
`reference.md`.

## Python Script Structure

Use Python when a file-centric knowledge-work library materially improves the
outcome, such as PDF, DOCX, XLSX, or local ML processing. Use `argparse`, begin
the file with a concise module docstring, and keep third-party imports close to
the operation that uses them so `--help` remains reliable.

Declare every runtime package in `pyproject.toml`, put test-only packages in a
`test` extra, and refresh the committed lockfile after dependency changes:

```bash
uv lock --directory skills/skill-name
```

Use the package wrapper to test the locked project:

```json
{
  "scripts": {
    "check:python": "uv run --locked --project . --extra test python -m compileall -q scripts tests",
    "test": "uv run --locked --project . --extra test pytest tests/ -v"
  }
}
```

Python scripts do not need TypeScript-style exported functions.

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

Each TypeScript skill needs a `tests/scripts.test.ts` and a
`vitest.config.ts`. **Without `vitest.config.ts` the tests are silently skipped**
by the root Vitest workspace config (which globs `./skills/*/vitest.config.ts`).

### `vitest.config.ts` (copy exactly)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
  },
});
```

Python skills use `tests/test_scripts.py` and the locked `uv` project. Refer to
an existing skill in the same runtime for test conventions and patterns.

---

## Summary Checklist

### Core Quality

- [ ] Description focuses on user intent, includes trigger scenarios, is under 1024 chars
- [ ] The skill routes generative work to library recipes and closed work to scripts
- [ ] Recipes are executable in the installed runtime and use task-relative paths
- [ ] The skill includes a structural or visual verification loop
- [ ] `SKILL.template.md` normally contains `{{GENERATED_SCRIPT_INDEX}}`
- [ ] `SKILL.md` is generated from workspace root — `pnpm tsx scripts/generate-skill-md.ts --skill skill-name`

### Files

- [ ] TypeScript: `tsconfig.json`, `vitest.config.ts`, `tests/scripts.test.ts`, and npm dependencies
- [ ] Python: `pyproject.toml`, `uv.lock`, `tests/test_scripts.py`, and complete dependency extras

### TypeScript Scripts

- [ ] File-level JSDoc describes what the script does (becomes the heading description)
- [ ] Use `@note` tags for important caveats (rendered as callouts)
- [ ] Use **CAC** for CLI parsing, not `parseArgs`
- [ ] Export a named async function; guard CLI with `import.meta.url`
- [ ] Log output paths relative to `process.cwd()`
- [ ] Use `createRequire` to resolve package-internal files (e.g. WASM), not `import.meta.resolve`

### Python Scripts

- [ ] Module docstring describes the script's user-visible purpose
- [ ] `argparse` provides complete `--help` output without importing optional runtime packages
- [ ] `pyproject.toml` declares runtime and test dependencies, and `uv.lock` is current
- [ ] No external system package is required for the core workflow

### Tests

- [ ] Fixtures generate the read-path inputs the test depends on
- [ ] All outputs write to an OS temporary directory
- [ ] Tests pass: `cd skills/<name> && pnpm test`
