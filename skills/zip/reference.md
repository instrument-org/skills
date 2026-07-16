# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

### `create-zip.ts` Create a ZIP archive from files or directories

Exports:

- `createZip({ outputPath, inputPaths, overwrite, }: { outputPath: string; inputPaths: readonly string[]; overwrite?: boolean; }): { outputPath: string; entryCount: number; }`

```text
create-zip

Usage:
  $ create-zip --output <path> <input...>

Options:
  --output <path>  Output ZIP file path
  --overwrite      Replace an existing output archive
  -h, --help       Display this message
```

### `extract-zip.ts` Extract all files from a ZIP archive

Exports:

- `extractZip({ inputPath, outputDir, overwrite, }: { inputPath: string; outputDir?: string; overwrite?: boolean; }): { outputDir: string; files: string[]; }`

```text
extract-zip

Usage:
  $ extract-zip <zipfile> [--output <dir>]

Options:
  --output <dir>  Output directory for extracted files
  --overwrite     Allow replacing files in the output directory
  -h, --help      Display this message
```

> [!NOTE]
> If --output is not specified, files are extracted into a directory named after the zip file (without the .zip extension) in the same location as the archive.

### `list-zip.ts` List entries in a ZIP archive with sizes

Exports:

- `listZip({ inputPath }: { inputPath: string; }): ZipEntryInfo[]`

```text
list-zip

Usage:
  $ list-zip <zipfile>

Options:
  -h, --help  Display this message
```
