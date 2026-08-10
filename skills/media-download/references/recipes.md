# Media download recipes

Extended recipes for yt-dlp. The main skill covers inspection, captions, audio, video, sections, playlists, and access failures. Everything here is a less common variation.

## Metadata without downloading

Print selected fields for one URL:

```bash
yt-dlp --print "%(title)s" --print "%(uploader)s" --print "%(upload_date)s" "$URL"
```

Write full metadata to disk alongside a download:

```bash
yt-dlp --write-info-json -o "%(title)s.%(ext)s" "$URL"
```

Useful `info.json` fields: `title`, `description`, `duration`, `upload_date`, `uploader`, `channel`, `webpage_url`, `chapters`, `subtitles`, `automatic_captions`, `formats`, `thumbnails`, `view_count`, `tags`.

The file can contain uploader identity, comments, and other personal data. Read what you need from it and do not copy it wholesale into a deliverable.

Extract just the chapter list:

```bash
yt-dlp --dump-json "$URL" | python3 -c "import json,sys; [print(f\"{c['start_time']:.0f} {c['title']}\") for c in (json.load(sys.stdin).get('chapters') or [])]"
```

Print one field across every item in a playlist, without downloading:

```bash
yt-dlp --flat-playlist --print "%(title)s | %(url)s" "$PLAYLIST_URL"
```

`--flat-playlist` skips resolving each entry, so it returns quickly on large channels. Use it to count and preview a playlist before committing to a download.

## Thumbnails

```bash
yt-dlp --write-thumbnail --skip-download -o "%(title)s.%(ext)s" "$URL"
```

All available sizes:

```bash
yt-dlp --list-thumbnails "$URL"
yt-dlp --write-all-thumbnails --skip-download "$URL"
```

Convert to a specific format during download:

```bash
yt-dlp --write-thumbnail --convert-thumbnails jpg --skip-download "$URL"
```

Embed the thumbnail as cover art in an extracted audio file:

```bash
yt-dlp -t mp3 --embed-thumbnail --embed-metadata -o "%(title)s.%(ext)s" "$URL"
```

## Subtitles

List what exists before requesting anything. The output separates human-authored tracks from automatic captions:

```bash
yt-dlp --list-subs "$URL"
```

Language selection accepts regular expressions and a comma-separated list:

```bash
yt-dlp --skip-download --write-subs --sub-langs "en.*,es" --convert-subs srt "$URL"
```

`en.*` matches `en`, `en-US`, `en-GB`, and `en-orig`, which matters because sites are inconsistent about which variant they publish. Requesting a bare `en` on a source that only offers `en-US` silently returns nothing.

Everything available:

```bash
yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs all "$URL"
```

Convert to plain text by stripping the timing from an SRT:

```bash
python3 -c "
import re, sys
from pathlib import Path
lines = Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
out = []
for line in lines:
    line = line.strip()
    if not line or line.isdigit() or '-->' in line:
        continue
    line = re.sub(r'<[^>]+>', '', line)
    if not out or out[-1] != line:
        out.append(line)
print(' '.join(out))
" subtitles.en.srt
```

The `out[-1] != line` check matters. Auto-generated captions repeat each line as the rolling two-line display scrolls, so a naive strip produces a transcript where every phrase appears twice.

Burn subtitles into the video, or embed them as a selectable track:

```bash
yt-dlp -t mp4 --write-subs --sub-langs "en.*" --embed-subs -o "%(title)s.%(ext)s" "$URL"
```

`--embed-subs` adds a soft track the player can toggle. To burn them permanently into the picture, download the subtitle file and use the `ffmpeg` skill's subtitle recipe.

## Format selection

Inspect before selecting:

```bash
yt-dlp --list-formats "$URL"
```

The presets cover most requests:

| Preset     | Result                                                 |
| ---------- | ------------------------------------------------------ |
| `-t mp4`   | H.264 and AAC, remuxed to MP4, broadly compatible      |
| `-t mkv`   | Best available streams, remuxed to MKV                 |
| `-t mp3`   | Audio only, converted to MP3                           |
| `-t aac`   | Audio only, converted to AAC                           |
| `-t sleep` | Adds polite delays between requests, for large batches |

Sorting fields, applied left to right, each defaulting to descending:

```bash
yt-dlp -S "res:1080,fps,vcodec:h264,acodec:aac" "$URL"
```

Common fields: `res`, `fps`, `vcodec`, `acodec`, `br` (bitrate), `size`, `hdr`, `ext`, `proto`. A field with a value such as `res:1080` means "prefer at most 1080, then as close to it as possible", which is why sorting is safer than a hard filter.

Sort fields accumulate across every `-S` and across a preset, and each new `-S` is prepended, so the rightmost one outranks the rest. Place a `-S` after any `-t` preset whose sort it needs to override, and use `--format-sort-force` when the sort must also outrank the internal default ordering.

Reverse a field with a `+` prefix. Smallest file first:

```bash
yt-dlp -S "+size" "$URL"
```

Explicit selectors are still available when a strict requirement exists:

```bash
yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" "$URL"
```

Read this as: best video at or below 720 plus best audio, falling back to the best pre-merged file at or below 720. Always include a `/` fallback branch, or the command fails outright on sources that do not offer separate streams.

Audio-only without conversion, keeping the source codec:

```bash
yt-dlp -f "ba" -o "%(title)s.%(ext)s" "$URL"
```

This avoids a re-encode. Prefer it when the audio feeds a transcriber that accepts the native format, since transcoding to MP3 only loses quality.

## Sections and chapters

Multiple ranges in one command:

```bash
yt-dlp --download-sections "*0:30-1:00" --download-sections "*5:00-6:30" -t mp4 "$URL"
```

From a timestamp to the end, and relative to the end:

```bash
yt-dlp --download-sections "*10:15-inf" "$URL"
yt-dlp --download-sections "*-2:00-inf" "$URL"   # final two minutes
```

Match a chapter by title instead of a timestamp. Without the `*` prefix the argument is a regular expression:

```bash
yt-dlp --download-sections "Introduction" "$URL"
```

Split a full download into one file per chapter:

```bash
yt-dlp -t mp4 --split-chapters -o "chapter:%(title)s/%(section_number)03d-%(section_title)s.%(ext)s" "$URL"
```

Section downloads and chapter splitting both require ffmpeg.

## Playlists and batches

Preview before downloading:

```bash
yt-dlp --flat-playlist --print "%(playlist_index)s %(title)s" "$PLAYLIST_URL" | head -20
```

Ranges use `[START]:[STOP][:STEP]`, and negative indexes count from the end:

```bash
yt-dlp -I 1:10 "$PLAYLIST_URL"      # first ten
yt-dlp -I -5: "$PLAYLIST_URL"       # last five
yt-dlp -I 2,4,6 "$PLAYLIST_URL"     # specific items
```

Organize output into per-playlist folders:

```bash
yt-dlp -P "output" -o "%(playlist_title)s/%(playlist_index)03d-%(title)s.%(ext)s" "$PLAYLIST_URL"
```

Skip items already fetched across runs:

```bash
yt-dlp --download-archive archive.txt "$PLAYLIST_URL"
```

The archive file records each completed item, so an interrupted batch resumes where it stopped instead of re-downloading. Keep it out of the deliverable.

Filter by duration or date rather than downloading and discarding:

```bash
yt-dlp --match-filter "duration < 600" "$PLAYLIST_URL"
yt-dlp --dateafter 20240101 "$PLAYLIST_URL"
```

Read URLs from a file, one per line:

```bash
yt-dlp -a urls.txt -o "%(title)s.%(ext)s"
```

Be polite on any multi-item run. Add `-t sleep`, or set `--sleep-requests` and `--limit-rate` explicitly.

## Rate limiting and reliability

```bash
yt-dlp --limit-rate 2M --sleep-requests 1 --retries 10 --fragment-retries 10 "$URL"
```

Speed up fragmented streams by fetching pieces concurrently:

```bash
yt-dlp -N 4 "$URL"
```

Raise `-N` cautiously. It multiplies request rate, which is exactly what triggers throttling on sources that are already rationing.

Continue a partial download. This is the default, so simply rerun the identical command rather than deleting the `.part` file and starting over.

Keep going when one item in a batch fails:

```bash
yt-dlp --ignore-errors -a urls.txt
```

Check the exit code and the per-item output afterwards. `--ignore-errors` makes a partially failed run look successful.

## Access

Cookies from a browser profile:

```bash
yt-dlp --cookies-from-browser firefox "$URL"
yt-dlp --cookies-from-browser "chrome:Profile 2" "$URL"
```

Supported browsers: brave, chrome, chromium, edge, firefox, opera, safari, vivaldi, whale. Extraction can fail while the browser holds its cookie database locked, so try another installed browser or close the running one.

A cookies file exported by a browser extension:

```bash
yt-dlp --cookies cookies.txt "$URL"
```

Browser impersonation, for sources that fingerprint the TLS handshake:

```bash
pip install -U "yt-dlp[default]"
yt-dlp --impersonate chrome "$URL"
yt-dlp --list-impersonate-targets
```

Custom headers, when a source requires a referer or token:

```bash
yt-dlp --add-header "Referer:https://example.com/" --add-header "Authorization:Bearer $TOKEN" "$URL"
```

Never write a token or cookie into a file that lands in the deliverable, and never echo one into a transcript.

## Generic and direct URLs

yt-dlp handles plain media links and HLS or DASH manifests, not just recognized sites:

```bash
yt-dlp -o "video.%(ext)s" "https://example.com/path/stream.m3u8"
```

For a plain static file with a stable URL, an ordinary fetch is simpler and does not need yt-dlp at all. Reach for yt-dlp when the source is a page rather than a file, when streams need merging, or when a manifest has to be reassembled from fragments.

When a page embeds media that yt-dlp cannot find, the `agent-browser` skill can open the page and surface the real media URL, which yt-dlp can then take.

## Live streams

Record a stream in progress from the current moment:

```bash
yt-dlp -o "stream.%(ext)s" "$LIVE_URL"
```

Include the portion already buffered by the source:

```bash
yt-dlp --live-from-start -o "stream.%(ext)s" "$LIVE_URL"
```

A live recording runs until the stream ends. Cap it, confirm the intent, and warn about unbounded disk use before starting one.

Wait for a scheduled stream instead of failing immediately:

```bash
yt-dlp --wait-for-video 60 "$URL"
```

## SponsorBlock

For sources covered by the SponsorBlock database, mark segments as chapters or remove them:

```bash
yt-dlp --sponsorblock-mark all -t mp4 "$URL"
yt-dlp --sponsorblock-remove sponsor,selfpromo -t mp4 "$URL"
```

Marking is reversible and adds navigable chapters. Removal re-encodes and discards content permanently, so prefer marking unless removal was requested.

Categories include `sponsor`, `intro`, `outro`, `selfpromo`, `preview`, `filler`, `interaction`, and `music_offtopic`.

## Output templates

Fields are substituted from the item's metadata:

```bash
yt-dlp -o "%(upload_date>%Y-%m-%d)s %(uploader)s - %(title)s.%(ext)s" "$URL"
```

Useful modifiers:

| Syntax                     | Effect                                        |
| -------------------------- | --------------------------------------------- |
| `%(title).80s`             | Truncate to 80 characters                     |
| `%(title,alt_title)s`      | First non-empty of several fields             |
| `%(upload_date>%Y-%m-%d)s` | Format a date                                 |
| `%(playlist_index)03d`     | Zero-padded number, for sortable batch output |
| `%(id)s`                   | Stable identifier, safe when titles collide   |

Truncate long titles. Path length limits still bite on Windows, and some titles are hundreds of characters.

Route different file types to different directories:

```bash
yt-dlp -P "home:output" -P "temp:work" --write-subs --write-thumbnail "$URL"
```

`temp` holds in-progress fragments, keeping partial files out of the deliverable until the download completes.
