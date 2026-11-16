"""The page count Word last saved, which a document stops matching once anything but Word edits it.

`docProps/app.xml` records `<Pages>` at each Word save, and python-docx's own
template says 1. Word and LibreOffice count the pages again when they open a
file, but Instrument's Word viewer holds its pagination to the stored count
and lets body text run past the bottom margin rather than start a page the
count does not have. Every script that saves a document removes the count,
and the preview lays out a copy without it.
"""

import io
import re
import zipfile

STORED_PAGE_COUNT = re.compile(rb"<Pages>\s*\d+\s*</Pages>")
APP_PART = "/docProps/app.xml"


def drop_stored_page_count(document):
    """Remove the stored page count from a python-docx Document before it is saved."""
    for part in document.part.package.iter_parts():
        if part.partname == APP_PART:
            part._blob = STORED_PAGE_COUNT.sub(b"", part.blob)
            return


def without_stored_page_count(data):
    """A .docx's bytes with the stored page count removed, or the bytes as they are when it has none."""
    try:
        source = zipfile.ZipFile(io.BytesIO(data))
        app = source.read(APP_PART.lstrip("/"))
    except (zipfile.BadZipFile, KeyError):
        return data
    if not STORED_PAGE_COUNT.search(app):
        return data
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as target:
        for entry in source.infolist():
            content = source.read(entry.filename)
            if entry.filename == APP_PART.lstrip("/"):
                content = STORED_PAGE_COUNT.sub(b"", content)
            target.writestr(entry, content)
    return out.getvalue()
