---
name: local-ml
description: "Run local AI models on images, audio, and text — no API keys needed. Use when the user wants to: remove an image background, classify or describe an image, detect objects in an image, transcribe audio to text (speech-to-text), classify text or run sentiment analysis, generate text embeddings for semantic search or similarity, or extract named entities (people, organizations, locations). Models download on first use and are cached locally."
---

# Local ML

Run local AI models via Python's `transformers`, `sentence-transformers`,
`rembg`, and `openai-whisper` libraries. No API keys needed. All inference
runs on CPU.

## Dependencies

Install before first use:

```
pip install transformers torch Pillow sentence-transformers "rembg[cpu]" "numba>=0.60" openai-whisper
```

Install only what you need — `torch` is large (~2 GB). Each script lists its
specific requirements.

`rembg` needs its CPU backend (`rembg[cpu]`) and a `numba>=0.60` floor — without
the floor the resolver picks a legacy `numba` that fails to build.

## Model downloads

Models are downloaded on first use and cached in `~/.cache/huggingface/` and
`~/.cache/whisper/`. Typical sizes:

- Background removal (rembg u2net): ~170 MB
- Image classification (ViT): ~350 MB
- Image captioning (BLIP): ~900 MB
- Object detection (DETR): ~160 MB
- Text classification (DistilBERT): ~270 MB
- Named entity recognition (BERT NER): ~430 MB
- Sentence embeddings (MiniLM): ~90 MB
- Speech-to-text (Whisper base): ~140 MB

## Scripts

### `classify-image.py` Classify an image using a zero-shot or ImageNet model.

```text
usage: classify-image.py [-h] [--labels LABELS] [--model MODEL]
                         [--top-k TOP_K]
                         input

Classify an image

positional arguments:
  input            Input image file

options:
  -h, --help       show this help message and exit
  --labels LABELS  Comma-separated labels for zero-shot classification
  --model MODEL    HuggingFace model ID override
  --top-k TOP_K
```

### `classify-text.py` Classify text using sentiment analysis or zero-shot labels.

```text
usage: classify-text.py [-h] --text TEXT [--labels LABELS] [--multi-label]
                        [--model MODEL] [--top-k TOP_K]

Classify text

options:
  -h, --help       show this help message and exit
  --text TEXT      Text to classify
  --labels LABELS  Comma-separated labels for zero-shot classification
  --multi-label
  --model MODEL    HuggingFace model ID override
  --top-k TOP_K
```

### `describe-image.py` Generate a natural-language description of an image (image captioning).

```text
usage: describe-image.py [-h] [--model MODEL] input

Describe an image

positional arguments:
  input          Input image file

options:
  -h, --help     show this help message and exit
  --model MODEL
```

### `detect-objects.py` Detect objects in an image and return bounding boxes with labels.

```text
usage: detect-objects.py [-h] [--model MODEL] [--threshold THRESHOLD] input

Detect objects in an image

positional arguments:
  input                 Input image file

options:
  -h, --help            show this help message and exit
  --model MODEL
  --threshold THRESHOLD
                        Confidence threshold (default: 0.9)
```

### `embed-text.py` Generate sentence embeddings for semantic search or similarity.

```text
usage: embed-text.py [-h] [--text TEXT] [--input INPUT] [--model MODEL]

Embed text as a vector

options:
  -h, --help     show this help message and exit
  --text TEXT    Text to embed
  --input INPUT  File with one text per line
  --model MODEL
```

### `extract-entities.py` Extract named entities (people, organizations, locations, dates) from text.

```text
usage: extract-entities.py [-h] [--text TEXT] [--input INPUT] [--model MODEL]
                           [--json]

Extract named entities from text

options:
  -h, --help     show this help message and exit
  --text TEXT    Text to process
  --input INPUT  Input text file
  --model MODEL
  --json
```

### `remove-background.py` Remove the background from an image, outputting a PNG with transparency.

```text
usage: remove-background.py [-h] [--output OUTPUT]
                            [--model {u2net,u2net_human_seg,isnet-general-use}]
                            input

Remove image background

positional arguments:
  input                 Input image (PNG, JPG, WEBP)

options:
  -h, --help            show this help message and exit
  --output OUTPUT       Output PNG path (default: <input>-nobg.png)
  --model {u2net,u2net_human_seg,isnet-general-use}
                        Model to use (default: u2net)
```

### `speech-to-text.py` Transcribe audio to text using OpenAI Whisper.

```text
usage: speech-to-text.py [-h] [--model {tiny,base,small,medium,large}]
                         [--language LANGUAGE] [--json]
                         input

Transcribe audio to text

positional arguments:
  input                 Audio file

options:
  -h, --help            show this help message and exit
  --model {tiny,base,small,medium,large}
                        Whisper model size (default: base)
  --language LANGUAGE   Language code, e.g. 'en', 'fr'
  --json                Output full JSON with timestamps
```

## Notes

- All models run on CPU. Inference can be slow for large models on long inputs.
- `speech-to-text.py` accepts most audio formats directly (ffmpeg is used internally
  by Whisper for format conversion).
- To use a GPU if available, set `CUDA_VISIBLE_DEVICES=0` in the environment;
  the scripts use whatever device PyTorch finds.
