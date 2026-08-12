---
name: zip
description: "Create, extract, and list zip archives. Use when working with zip files, archives, compressed files, .zip, .numbers, extracting/unzipping archives, or compressing files into a zip."
---

# Zip

Use the bundled scripts for ordinary archive creation, listing, and extraction. For selective or format-aware work, write a small Python program with the standard-library `zipfile` module and adapt the recipes below.

## Choose an approach

| Need                                           | Approach                         |
| ---------------------------------------------- | -------------------------------- |
| Create, list, or fully extract a normal ZIP    | Use the matching bundled script  |
| Control each member's path inside the archive  | Write a Python `zipfile` recipe  |
| Read or extract selected members               | Write a Python `zipfile` recipe  |
| Add, replace, or remove members                | Rebuild to a new archive         |
| Inspect `.numbers` or another ZIP-based format | Read members without mutating it |

## Recipe: create an archive with exact member paths

```python
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

output = Path("output/package.zip")
output.parent.mkdir(parents=True, exist_ok=True)

members = {
    Path("attachments/report.csv"): "data/report.csv",
    Path("attachments/readme.txt"): "README.txt",
}

with ZipFile(output, "x", compression=ZIP_DEFLATED) as archive:
    for source, archive_name in members.items():
        archive.write(source, arcname=archive_name)
```

Mode `"x"` refuses to overwrite an existing deliverable. Use a new output path while iterating.

## Recipe: inspect or read members without extracting

```python
from zipfile import ZipFile

with ZipFile("attachments/archive.zip") as archive:
    for member in archive.infolist():
        print(member.filename, member.file_size, member.compress_size)

    manifest = archive.read("manifest.json").decode("utf-8")
    print(manifest)
```

This is the safest starting point for ZIP-based document bundles. Their internal files usually have format-specific relationships, so do not rewrite the bundle unless the requested format is understood.

## Recipe: selectively extract safe members

Archive member names are untrusted paths. Validate them before extraction, including backslashes that become separators on Windows.

```python
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

destination = Path("work/extracted").resolve()
destination.mkdir(parents=True, exist_ok=False)
wanted = {"data/report.csv", "manifest.json"}

with ZipFile("attachments/archive.zip") as archive:
    for member in archive.infolist():
        name = member.filename.replace("\\", "/")
        path = PurePosixPath(name)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError(f"Unsafe archive member: {member.filename}")
        if path.parts and path.parts[0].endswith(":"):
            raise ValueError(f"Unsafe archive member: {member.filename}")
        if name not in wanted:
            continue

        target = (destination / name).resolve()
        if target != destination and destination not in target.parents:
            raise ValueError(f"Unsafe archive member: {member.filename}")
        archive.extract(member, destination)
```

## Recipe: modify by rebuilding

ZIP archives do not support reliable in-place deletion or replacement. Read the source and write a distinct archive, copying only members that should remain and then adding replacements. Verify the new member list and contents before delivering it.

## Script safety

The create and extract scripts refuse to overwrite by default. Pass `--overwrite` only when replacing the destination is intentional. Extract to a new directory when inspecting an unfamiliar archive.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

{{GENERATED_SCRIPT_INDEX}}
