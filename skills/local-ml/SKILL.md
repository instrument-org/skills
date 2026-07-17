---
name: local-ml
description: "Run local AI models on images, audio, and text with no inference API key. Use when the user wants to remove an image background, classify or describe images, detect objects, transcribe audio, classify text, create embeddings for similarity or search, or extract named entities. Model weights download on first use and are cached locally."
---

# Local ML

Use Python libraries directly when the work needs batching, model reuse,
custom scoring, or structured outputs. The supplied scripts are convenient for
single-input operations with standard defaults.

## Choose an approach

| Need                                                   | Approach                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| One image, text, or audio file with standard output    | Run the matching script                                       |
| Many inputs or repeated inference                      | Write Python that loads the model once                        |
| Similarity, ranking, aggregation, or custom thresholds | Compose the library APIs                                      |
| A reusable artifact                                    | Write structured results to `output/` and record the model ID |

Python packages share the task virtual environment, so custom recipes may live
under `work/`. Run them from the task root so `attachments/`, `work/`, and
`output/` resolve correctly.

## Optional dependencies

The app installs the locked base dependency, Pillow. Install only the feature
stack the task needs:

```bash
pip install "rembg[cpu]" "numba>=0.60"          # background removal
pip install faster-whisper                       # speech-to-text
pip install openai-whisper                       # Windows on ARM fallback
pip install transformers torch                   # vision, classification, NER
pip install sentence-transformers                # embeddings and similarity
```

Inference stays local, but the first use downloads third-party model weights
and contacts their model host. Downloads are model-dependent, commonly around
100 MB to 1 GB, and are cached outside the deliverable. `torch` itself is also
large. State that cost before selecting a large model or processing a long
recording.

## Recipes

### Reuse a classifier across a batch

This reads one text per line and writes ranked labels as JSON. Save it as
`work/classify-batch.py`, then run `python work/classify-batch.py`.

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

Use `multi_label=False` when labels are mutually exclusive. Calibrate a
decision threshold from the observed scores instead of treating the top label
as certain.

### Rank text by semantic similarity

Normalized embeddings make the dot product a cosine-similarity score. The
default here matches `embed-text.py`: BGE small, whose vectors have 384
dimensions.

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

`u2net` is fast and fine for high-contrast subjects. For hair, fur, or edges
that fringe into a gray or colored halo, switch to
`new_session("birefnet-general")` (about 1 GB on first use) or pass
`alpha_matting=True` to `remove`. Do not segment an image that is already
cleanly isolated; flatten or composite it onto the target color instead (see
Traps).

### Preserve transcript timestamps

```python
import json
from pathlib import Path

from faster_whisper import WhisperModel

model_name = "base"
model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "attachments/interview.m4a",
    vad_filter=True,
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

- Do not remove a background that is already clean. Inspect the source first
  (`Image.open(path).mode` for an alpha channel; view it for a solid backdrop).
  Product and catalog images are often already isolated on white or already
  transparent, and re-segmenting them only adds edge fringing and color halos.
  When the goal is a solid background, flatten or composite the existing image
  onto that color (the `sharp-images` skill) instead of running removal.
- Load each model once. Repeated script invocations repeat initialization and
  may repeat expensive setup.
- Model output is probabilistic. Preserve scores and review low-confidence or
  high-impact results.
- The default NER model recognizes people, organizations, locations, and
  miscellaneous entities. It does not provide a date category.
- Avoid arbitrary models that require `trust_remote_code=True` unless their
  code has been deliberately reviewed.
- Long inputs may be truncated by a model. Chunk them with overlap and retain
  source offsets when traceability matters.
- Model caches and optional packages can consume several gigabytes. Do not
  install every feature stack by default.

## Verification

- Record the exact model ID and meaningful parameters in structured output.
- Confirm result counts match input counts and inspect score distributions.
- Spot-check transcripts against the audio, especially names and numbers.
- Inspect masks and object boxes visually instead of trusting file existence.
- Confirm output files contain usable data and not only successful exit codes.

## Script index

Use these for closed, single-input operations. Full options are in
[`reference.md`](reference.md).

- `classify-image.py`: Classify an image using a zero-shot or ImageNet model.
- `classify-text.py`: Classify text using sentiment analysis or zero-shot labels.
- `describe-image.py`: Generate a natural-language description of an image (image captioning).
- `detect-objects.py`: Detect objects in an image and return bounding boxes with labels.
- `embed-text.py`: Generate sentence embeddings for semantic search or similarity.
- `extract-entities.py`: Extract named entities such as people, organizations, and locations from text.
- `remove-background.py`: Remove the background from an image, outputting a PNG with transparency.
- `speech-to-text.py`: Transcribe audio to text using Whisper.
