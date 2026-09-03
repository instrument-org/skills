---
name: local-ml
description: "Run local AI models on images, audio, and text with no inference API key. Use when the user wants to remove an image background, classify or describe images, detect objects, transcribe audio, classify text, create embeddings for similarity or search, or extract named entities. Model weights download on first use and are cached locally."
---

# Local ML

Use Python libraries directly when the work needs batching, model reuse, custom scoring, or structured outputs. The supplied scripts are convenient for single-input operations with standard defaults.

## Choose an approach

| Need                                                   | Approach                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| One image, text, or audio file with standard output    | Run the matching script                                       |
| Many inputs or repeated inference                      | Write Python that loads the model once                        |
| Similarity, ranking, aggregation, or custom thresholds | Compose the library APIs                                      |
| A reusable artifact                                    | Write structured results to `output/` and record the model ID |

Python packages share the task virtual environment, so custom recipes may live under `work/`. Run them from the task root so `attachments/`, `work/`, and `output/` resolve correctly.

## Optional dependencies

The app installs the locked base dependency, Pillow. Install only the feature stack the task needs:

```bash
pip install "rembg[cpu]" "numba>=0.60"          # background removal
pip install faster-whisper                       # speech-to-text
pip install openai-whisper                       # Windows on ARM fallback
pip install transformers torch                   # vision, classification, NER
pip install sentence-transformers                # embeddings and similarity
```

Inference stays local, but the first use downloads third-party model weights and contacts their model host. Downloads are model-dependent, commonly around 100 MB to 1 GB, and are cached outside the deliverable. `torch` itself is also large. State that cost before selecting a large model or processing a long recording.

## Transcribe a recording

Speech-to-text usually runs on the CPU. `faster-whisper` is built on CTranslate2, which accelerates only on NVIDIA GPUs; the script uses one when it finds one, and every other machine, Apple silicon included, is CPU-bound no matter which model is chosen. Treat transcription as minutes of compute, not seconds, and plan the job before starting it.

Silence is skipped and repetition loops are disarmed by default, so the pathological audio in a real recording costs closer to what its speech costs. That is throughput, not accuracy: it does not change how long the speech itself takes.

### Convert the audio first

When the recording came from a URL, use the `media-download` skill instead of anything here: published captions are a small text download and cost no inference, so they are worth checking before transcribing at all.

For a local file, the transcriber wants mono 16 kHz audio. Produce it with the `ffmpeg` skill before transcribing, whatever the source container:

```bash
ffmpeg -n -i "$INPUT" -vn -c:a pcm_s16le -ar 16000 -ac 1 work/audio.wav
```

`-vn` drops the video stream, so a video file needs no separate extraction step. This does not make the transcription itself faster, since the decoder only ever reads the audio stream. It is worth doing because it produces a small intermediate file, fixes the sample rate and channel count the model expects, and gives you a duration to plan against.

Read the duration before deciding anything else:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 work/audio.wav
```

### Choose a model against the duration

Larger models cost more per minute of audio and the difference compounds over a long recording. Rough throughput on a laptop CPU, as a multiple of realtime:

| Model                | Throughput           | Use it for                                           |
| -------------------- | -------------------- | ---------------------------------------------------- |
| `tiny`, `base`       | 3-25x realtime       | The default. Drafts, keyword spotting, clean speech  |
| `turbo`              | 2-6x realtime        | When accuracy matters: names, jargon, poor recording |
| `small`              | 1-3x realtime        | Rarely worth it; `turbo` is faster and more accurate |
| `medium`, `large-v3` | At or below realtime | Short clips only, where accuracy dominates           |

The script defaults to `base`, so pass `--model turbo` deliberately when the transcript has to be right rather than quick. Both handle clean speech well; `turbo` earns its cost on proper nouns and difficult audio.

The spread inside each row is real: audio that sends the decoder into repetition loops, such as music, cross-talk, or long silence, costs several times what clean speech costs. `medium` and `large-v3` can take longer than the recording itself and are almost never the right choice for a full-length recording.

Do not guess from that table when the recording is long. Calibrate on the machine you are actually running on:

```bash
ffmpeg -n -i work/audio.wav -t 60 work/sample.wav
time python <local-ml-skill-path>/scripts/speech-to-text.py work/sample.wav --model turbo
```

Multiply by the number of minutes in the recording, tell the user the estimate before starting the full run, and pick a smaller model if the answer is unreasonable.

### Tell it the words it cannot guess

Whisper spells unfamiliar proper nouns phonetically: a product name becomes two ordinary words, a surname becomes a similar-sounding one. It is the largest single source of error in an otherwise good transcript, and it is the one you can fix before the run rather than after.

Build a term list from the context you already have. Names in the surrounding filenames and folders, people and products in the task's own documents, and whatever the user called things in their request are all fair game, and the user is the best source of any the recording will use.

```bash
python <local-ml-skill-path>/scripts/speech-to-text.py work/audio.wav --vocabulary "Instrument, Finalpoint, ripgrep, oxlint, tsgo"
```

Names, products, jargon, and acronyms. Not ordinary words the model already knows, and not so many that the list stops being about this recording; roughly the terms a new colleague would have to be told. `--vocabulary` sets both of Whisper's biasing inputs, which behave differently and are individually unreliable, so prefer it over passing either one by hand.

Repair what is left afterward, but expect much less of it.

### Run it so a stopped job keeps its work

Pass `--output` for anything longer than a few minutes. Segments are written as they are produced, so a run that is interrupted leaves a usable partial transcript instead of nothing:

```bash
python <local-ml-skill-path>/scripts/speech-to-text.py work/audio.wav --model turbo --vocabulary "..." --output output/transcript.txt
```

There is no speaker diarization here. Whisper returns text and timings, not who was speaking. Say so rather than labeling speakers by inference, and do not reach for a diarization stack without agreeing the cost first: those models are a separate download, several of them are gated behind an account, and on a CPU they can cost more than the transcription.

## Recipes

### Reuse a classifier across a batch

This reads one text per line and writes ranked labels as JSON. Save it as `work/classify-batch.py`, then run `python work/classify-batch.py`.

```python
import json
from pathlib import Path

from transformers import pipeline

model_id = "MoritzLaurer/deberta-v3-base-zeroshot-v2.0"
labels = ["urgent", "routine", "spam"]
source_text = Path("attachments/messages.txt").read_text(encoding="utf-8")
texts = [
    line.strip()
    for line in source_text.splitlines()
    if line.strip()
]

classifier = pipeline("zero-shot-classification", model=model_id)
predictions = classifier(
    texts,
    candidate_labels=labels,
    multi_label=True,
    batch_size=8,
)
records = [
    {
        "text": text,
        "labels": [
            {"label": label, "score": score}
            for label, score in zip(result["labels"], result["scores"])
        ],
        "model": model_id,
    }
    for text, result in zip(texts, predictions)
]
Path("output/classifications.json").write_text(
    json.dumps(records, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
```

Use `multi_label=False` when labels are mutually exclusive. Calibrate a decision threshold from the observed scores instead of treating the top label as certain.

### Rank text by semantic similarity

Normalized embeddings make the dot product a cosine-similarity score. The default here matches `embed-text.py`: BGE small, whose vectors have 384 dimensions.

```python
import json
from pathlib import Path

from sentence_transformers import SentenceTransformer

model_id = "BAAI/bge-small-en-v1.5"
query = "How do I reset my password?"
source_text = Path("attachments/articles.txt").read_text(encoding="utf-8")
documents = [
    line.strip()
    for line in source_text.splitlines()
    if line.strip()
]

model = SentenceTransformer(model_id)
vectors = model.encode([query, *documents], normalize_embeddings=True)
scores = vectors[1:] @ vectors[0]
ranked = sorted(
    (
        {"text": text, "score": float(score), "model": model_id}
        for text, score in zip(documents, scores)
    ),
    key=lambda item: item["score"],
    reverse=True,
)
Path("output/ranked.json").write_text(
    json.dumps(ranked, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
```

### Reuse one background-removal session

Creating a session loads the model. Reuse it for every image in the batch.

```python
from pathlib import Path

from rembg import new_session, remove

session = new_session("u2net")
destination = Path("output/background-removed")
destination.mkdir(parents=True, exist_ok=True)

for source in Path("attachments").glob("*"):
    if source.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    result = remove(source.read_bytes(), session=session)
    (destination / f"{source.stem}.png").write_bytes(result)
```

`u2net` is fast and fine for high-contrast subjects. For hair, fur, or edges that fringe into a gray or colored halo, switch to `new_session("birefnet-general")` (about 1 GB on first use) or pass `alpha_matting=True` to `remove`. Do not segment an image that is already cleanly isolated; flatten or composite it onto the target color instead (see Traps).

### Preserve transcript timestamps

```python
import json
from pathlib import Path

from faster_whisper import WhisperModel

model_name = "turbo"
terms = "Instrument, Finalpoint, ripgrep, oxlint, tsgo"
model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "work/audio.wav",
    vad_filter=True,
    condition_on_previous_text=False,
    initial_prompt=f"Glossary: {terms}.",
    hotwords=terms,
)
rows = [
    {"start": segment.start, "end": segment.end, "text": segment.text.strip()}
    for segment in segments
]
Path("output/transcript.json").write_text(
    json.dumps(
        {"language": info.language, "model": model_name, "segments": rows},
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)
Path("output/transcript.txt").write_text(
    "\n".join(row["text"] for row in rows),
    encoding="utf-8",
)
```

## Traps

- Do not remove a background that is already clean. Inspect the source first (`Image.open(path).mode` for an alpha channel; view it for a solid backdrop). Product and catalog images are often already isolated on white or already transparent, and re-segmenting them only adds edge fringing and color halos. When the goal is a solid background, flatten or composite the existing image onto that color (the `sharp-images` skill) instead of running removal.
- Load each model once. Repeated script invocations repeat initialization and may repeat expensive setup.
- Model output is probabilistic. Preserve scores and review low-confidence or high-impact results.
- The default NER model recognizes people, organizations, locations, and miscellaneous entities. It does not provide a date category.
- Avoid arbitrary models that require `trust_remote_code=True` unless their code has been deliberately reviewed.
- Long inputs may be truncated by a model. Chunk them with overlap and retain source offsets when traceability matters.
- Model caches and optional packages can consume several gigabytes. Do not install every feature stack by default.
- `segments` from `faster_whisper` is a generator, and the transcription runs as it is consumed. Nothing has happened until you iterate it, and iterating it is where the minutes go. Write each segment out as it arrives rather than materializing the whole list and saving at the end.
- Transcription has no progress output of its own. For a long recording, say what you are about to do and roughly how long it will take before you start, since the run is otherwise indistinguishable from a hang.
- An empty transcript from a file that does have audio usually means voice activity detection found no speech. Retry once with `--no-vad` before concluding the recording is silent: a very quiet or heavily processed track can fall under the threshold. Whisper invents text over digital silence, which is why detection is on by default, so a `--no-vad` transcript of near-silence needs reading before it is trusted.
- A custom recipe that calls `model.transcribe` directly gets library defaults, not the script's. Carry `vad_filter=True` and `condition_on_previous_text=False` across, and pass a glossary as both `initial_prompt` and `hotwords`, or the recipe will be slower and spell names worse than the script for the same audio.

## Verification

- Record the exact model ID and meaningful parameters in structured output.
- Confirm result counts match input counts and inspect score distributions.
- Spot-check transcripts against the audio, especially names and numbers.
- Inspect masks and object boxes visually instead of trusting file existence.
- Confirm output files contain usable data and not only successful exit codes.

## Script index

Use these for closed, single-input operations. Full options are in [`reference.md`](reference.md).

- `classify-image.py`: Classify an image using a zero-shot or ImageNet model.
- `classify-text.py`: Classify text using sentiment analysis or zero-shot labels.
- `describe-image.py`: Generate a natural-language description of an image (image captioning).
- `detect-objects.py`: Detect objects in an image and return bounding boxes with labels.
- `embed-text.py`: Generate sentence embeddings for semantic search or similarity.
- `extract-entities.py`: Extract named entities such as people, organizations, and locations from text.
- `remove-background.py`: Remove the background from an image, outputting a PNG with transparency.
- `speech-to-text.py`: Transcribe audio to text using Whisper.
