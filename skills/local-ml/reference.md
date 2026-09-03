# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `classify-image.py` Classify an image using a zero-shot or ImageNet model.

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

## `classify-text.py` Classify text using sentiment analysis or zero-shot labels.

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

## `describe-image.py` Generate a natural-language description of an image (image captioning).

```text
usage: describe-image.py [-h] [--model MODEL] input

Describe an image

positional arguments:
  input          Input image file

options:
  -h, --help     show this help message and exit
  --model MODEL
```

## `detect-objects.py` Detect objects in an image and return bounding boxes with labels.

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

## `embed-text.py` Generate sentence embeddings for semantic search or similarity.

```text
usage: embed-text.py [-h] [--text TEXT] [--input INPUT] [--model MODEL]

Embed text as a vector

options:
  -h, --help     show this help message and exit
  --text TEXT    Text to embed
  --input INPUT  File with one text per line
  --model MODEL
```

## `extract-entities.py` Extract named entities such as people, organizations, and locations from text.

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

## `remove-background.py` Remove the background from an image, outputting a PNG with transparency.

```text
usage: remove-background.py [-h] [--output OUTPUT]
                            [--model {u2net,u2net_human_seg,isnet-general-use,birefnet-general,birefnet-general-lite}]
                            [--alpha-matting]
                            input

Remove image background

positional arguments:
  input                 Input image (PNG, JPG, WEBP)

options:
  -h, --help            show this help message and exit
  --output OUTPUT       Output PNG path (default: <input>-nobg.png)
  --model {u2net,u2net_human_seg,isnet-general-use,birefnet-general,birefnet-general-lite}
                        u2net: fast, high-contrast subjects (default).
                        birefnet-general: best edges for hair/fur, ~1 GB
                        download. birefnet-general-lite: lighter BiRefNet.
                        u2net_human_seg: people. isnet-general-use: general.
  --alpha-matting       Refine edges to reduce halos/fringing (slower; helps
                        u2net/isnet).
```

## `speech-to-text.py` Transcribe audio to text using Whisper.

```text
usage: speech-to-text.py [-h]
                         [--model {tiny,base,small,medium,large,large-v3,turbo}]
                         [--language LANGUAGE] [--vocabulary VOCABULARY]
                         [--device {auto,cpu,cuda}] [--no-vad] [--json]
                         [--output OUTPUT]
                         input

Transcribe audio to text

positional arguments:
  input                 Audio file

options:
  -h, --help            show this help message and exit
  --model {tiny,base,small,medium,large,large-v3,turbo}
                        Whisper model size (default: base)
  --language LANGUAGE   Language code, e.g. 'en', 'fr'
  --vocabulary VOCABULARY
                        Comma-separated names, products, and jargon the
                        recording uses, to bias spelling
  --device {auto,cpu,cuda}
                        Compute device (default: auto)
  --no-vad              Disable voice activity detection, which is on by
                        default and skips silence
  --json                Output full JSON with timestamps
  --output OUTPUT       Write segments to this file as they are transcribed,
                        so a stopped run keeps its work
```
