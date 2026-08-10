---
name: media-download
description: "Download video, audio, subtitles, and metadata from web URLs with yt-dlp. Use when the user wants to save a video or podcast from a link, pull the audio out of an online video, get captions or a transcript for a URL, grab one clip or section of a long video, fetch a thumbnail or chapter list, or archive a playlist. Also use when a task needs a remote media file on disk before it can be processed locally. For editing or converting media already on disk, use the `ffmpeg` skill. For transcribing audio that has no published captions, hand off to the `local-ml` skill."
compatibility: "Requires yt-dlp and ffmpeg on PATH. Install yt-dlp with `pip install -U yt-dlp`, or run it without installing via `uvx yt-dlp`."
user-invocable: false
---

# Media Download

Use `yt-dlp` directly. It handles thousands of sites, plain direct links, and HLS or DASH streams behind a single interface, so treat the command line as the composition surface rather than looking for a wrapper.

Downloading is rarely the goal. It is the first step of a transcript, a clip, a summary, or an edit. Decide what the user actually wants before choosing flags, because the cheapest correct path is often not a download at all.

Read [references/recipes.md](references/recipes.md) for metadata, thumbnails, chapters, subtitle language selection, playlists, format-sort depth, live streams, and rate limiting.

## Keep yt-dlp current

Sites change their delivery constantly, and yt-dlp ships fixes on a much faster cadence than most tools. A stale copy is the single most common cause of failure.

**When extraction fails, update before debugging the command.**

```bash
pip install -U yt-dlp
```

Do not pin yt-dlp in a lockfile or reuse a months-old install. `uvx yt-dlp <args>` fetches a current build into a throwaway environment and is a good default when nothing is installed.

If an error mentions unable to extract, a changed player response, or an unsupported URL that the site clearly still serves, update first. Retrying the same command against the same stale build wastes time.

## Choose an approach

| The user wants                                    | Do this                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| A transcript or "what does this say"              | Try published captions first, then fall back to audio |
| The video file itself                             | Download with an explicit format preset               |
| Just the audio, or a podcast                      | Extract audio only, skipping video download entirely  |
| A specific moment or clip                         | Download only that section, not the whole file        |
| Title, duration, chapters, thumbnail              | Print metadata without downloading                    |
| A direct link to a plain `.mp4`, `.pdf`, or image | Fetch it normally; yt-dlp is not required             |

## Workflow

1. Inspect the URL before committing to a download.
2. Choose the smallest artifact that satisfies the request.
3. Download into the workspace with an explicit output path.
4. Verify the output before reporting success.
5. Hand off to the `ffmpeg` or `local-ml` skill for anything beyond acquisition.

## Inspect first

Never start a large download blind. Print what is behind the URL:

```bash
yt-dlp --print "%(title)s | %(duration)s s | %(filesize,filesize_approx)s bytes" "$URL"
```

Use the comma fallback in `%(filesize,filesize_approx)s`. Many extractors leave `filesize` empty on one field but not the other, and a bare `%(filesize_approx)s` reports `NA` on sources that do report an exact size.

Full metadata as JSON, still without downloading:

```bash
yt-dlp --dump-json "$URL" > info.json
```

List what is actually on offer:

```bash
yt-dlp --list-formats "$URL"
yt-dlp --list-subs "$URL"
```

Tell the user the duration and approximate size before starting anything long or large. A two-hour source is a very different proposition from a three-minute one, and the user may only want a section.

## Captions before transcription

For any transcript request, check for published captions first. They are a small text download, they are already speaker-timed, and they cost no inference. Local transcription costs a model download and minutes of CPU per hour of audio.

```bash
yt-dlp --skip-download \
  --write-subs --write-auto-subs \
  --sub-langs "en.*" --convert-subs srt \
  -o "%(title)s.%(ext)s" "$URL"
```

`--write-subs` takes human-authored captions, `--write-auto-subs` takes machine-generated ones. Requesting both prefers the human version when it exists. `--skip-download` means no media is fetched at all.

Only when `--list-subs` reports no usable track should you fall back to downloading audio and transcribing it. Say which route you took, because auto-generated captions and local transcription have different error profiles, and neither is a verbatim record.

Auto-generated caption files often repeat lines as the rolling display updates. Deduplicate before presenting a transcript.

## Audio for transcription

When captions are unavailable, extract audio in the form the transcriber wants rather than downloading a video and converting it afterwards.

The `local-ml` skill's speech-to-text expects mono 16 kHz audio. Produce it in one step:

```bash
yt-dlp -x --audio-format wav \
  --postprocessor-args "ExtractAudio:-ar 16000 -ac 1" \
  -o "audio.%(ext)s" "$URL"
```

`-x` discards the video stream, so this downloads far less than a full video on most sources. For a listenable file rather than a transcription input, use the `mp3` preset instead:

```bash
yt-dlp -t mp3 -o "%(title)s.%(ext)s" "$URL"
```

Warn about cost before transcribing a long recording. State the duration, and note that the first local transcription downloads model weights.

## Video

Use the built-in presets rather than hand-writing format selectors. `-t mp4` requests a broadly compatible H.264 and AAC result and remuxes it into MP4:

```bash
yt-dlp -t mp4 -o "%(title)s.%(ext)s" "$URL"
```

Cap resolution when full quality is not needed. This avoids pulling a 4K source for a file that will be watched in a window:

```bash
yt-dlp -t mp4 -S "res:1080" -o "%(title)s.%(ext)s" "$URL"
```

Order matters here. Each `-S` is prepended to the accumulated sort, so the last one on the command line has the highest priority. `-t mp4 -S "res:1080"` caps resolution, while `-S "res:1080" -t mp4` does not, because the preset's own sort then outranks it and picks the highest resolution available.

Prefer `-S` sorting over an explicit `-f` selector string. Sorting degrades gracefully when the requested combination is unavailable, whereas a strict `-f` expression fails outright on sources that do not offer that exact pairing.

Merging separate video and audio streams requires ffmpeg. So do audio extraction, remuxing, and section downloads.

## Sections and clips

Download only the part the user asked about instead of fetching hours to keep one minute:

```bash
yt-dlp --download-sections "*3:20-5:00" -t mp4 -o "clip.%(ext)s" "$URL"
```

The `*` prefix marks a time range. Without it the argument is a regular expression matched against chapter titles, which is the better choice when the user names a chapter rather than a timestamp.

Cuts land on keyframes, so the result usually runs slightly longer than the range requested. Add `--force-keyframes-at-cuts` when the boundaries must be exact, accepting a re-encode. Verify the actual duration afterwards rather than assuming it matches the request.

## Output paths and filenames

Write into the workspace with an explicit template. Media titles routinely contain slashes, colons, emoji, and right-to-left text, all of which break on at least one supported platform:

```bash
yt-dlp --restrict-filenames -P "output" -o "%(title)s.%(ext)s" "$URL"
```

`--restrict-filenames` reduces names to ASCII without spaces or `&`. Use it whenever the filename will be passed to another command, and prefer a caller-chosen fixed name when the file is an intermediate that only this task will read.

Quote the URL. Query strings contain `&`, which otherwise backgrounds the command in most shells.

## Playlists

A playlist or channel URL can expand to thousands of items. yt-dlp follows that expansion by default when the URL is a playlist.

Default to a single video, and require an explicit request before fetching a whole list:

```bash
yt-dlp --no-playlist "$URL"          # URL is a video that also sits in a playlist
yt-dlp -I 1:5 "$PLAYLIST_URL"        # first five items only
```

Before downloading a playlist, print its length and tell the user. Confirm before starting anything that will run long or consume significant disk.

## When access fails

| Symptom                                      | Try                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Unable to extract, or a format that vanished | Update yt-dlp; this is the most likely cause                        |
| Sign-in required, or age restriction         | `--cookies-from-browser chrome` (or firefox, safari, edge)          |
| Blocked as a bot, or a challenge page        | `--impersonate chrome`, which needs `pip install "yt-dlp[default]"` |
| Cookie extraction fails on a running browser | Try another installed browser, or close the browser first           |
| HTTP 429, or throttling partway through      | `--limit-rate 1M --sleep-requests 1`, or the `-t sleep` preset      |
| Fragment errors on a long stream             | Rerun the same command; yt-dlp resumes rather than restarting       |

`--cookies-from-browser` reads the user's real browser session. It sends their identity to the site, so use it when access genuinely requires a login, mention that you are doing so, and never write the extracted cookies into the deliverable.

Ask the user before reaching for cookies or impersonation. A sign-in wall is often a signal that the content is not meant to be fetched this way.

## Scope

- Download only what the user asked for. Do not opportunistically archive a channel because a URL happened to point into one.
- Do not attempt to defeat DRM, paywalls, or access controls. If a source is protected, say so and stop.
- Downloaded media belongs to someone. Keep it in the workspace, do not redistribute it, and note the source URL when producing a derived artifact.
- Treat `--write-info-json` output as potentially personal. It can carry uploader details and comments.

## Verify

Confirm the file is real media and matches the request:

```bash
ffprobe -v error -show_format -show_streams -of json "$OUTPUT"
```

Check what the request actually depended on:

- Duration matches, especially after a section download.
- The expected streams exist. An audio-only extraction should have no video stream, and a video download should have audio unless the source had none.
- Sample rate and channel count are right when the file feeds a transcriber.
- The file is not a few kilobytes of HTML error page wearing a media extension.

A nonzero exit code from yt-dlp means the download failed even if a `.part` file remains. Do not treat leftover fragments as success.

## Hand off

Acquisition ends here. For anything further:

- Trimming, converting, resizing, concatenating, extracting frames, or normalizing audio: the `ffmpeg` skill.
- Transcribing audio with no published captions: the `local-ml` skill.
- Pages that are not media, or media only reachable after interaction: the `agent-browser` skill.

Downloading a file and re-encoding it in the same breath usually means the download flags were wrong. Prefer getting the right artifact from yt-dlp over fixing it afterwards.

## Common failures

| Symptom                                        | Likely fix                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `Unsupported URL` on a site that clearly works | Update yt-dlp                                                     |
| Requested format is not available              | Use `-S` sorting instead of a strict `-f` selector                |
| Output has video when only audio was wanted    | Add `-x`, and confirm with ffprobe                                |
| Merged output fails, or stays as two files     | ffmpeg is missing or not on PATH                                  |
| Clip is longer than the requested range        | Keyframe boundaries; add `--force-keyframes-at-cuts`              |
| Command downloads hundreds of files            | Playlist expansion; add `--no-playlist` or `-I`                   |
| Filename breaks a later command                | `--restrict-filenames`, and quote every path                      |
| Subtitles download but are empty               | The track was auto-generated and unavailable; check `--list-subs` |
| `filesize_approx` prints `NA`                  | Use the `%(filesize,filesize_approx)s` fallback                   |
