---
name: local-ml
description: "Run local AI models on images, audio, and text — no API keys needed. Use when the user wants to: remove an image background, classify or describe an image, detect objects in an image, transcribe audio to text (speech-to-text), classify text or run sentiment analysis, generate text embeddings for semantic search or similarity, or extract named entities (people, organizations, locations). Models download on first use and are cached locally."
---

# Local ML

Run local AI models via Python's `transformers`, `sentence-transformers`,
`rembg`, and `openai-whisper` libraries. No API keys needed. All inference
runs on CPU.

## Dependencies

The app installs this skill's locked base dependency (`Pillow`) when it is
loaded. Install only the optional feature packages required for the requested
workflow:

```
pip install "rembg[cpu]" "numba>=0.60"          # background removal
pip install faster-whisper                         # speech-to-text
pip install openai-whisper                         # Windows on ARM only
pip install transformers torch sentence-transformers  # vision, text, embeddings
```

Install only what you need — `torch` is large (~2 GB). Each script lists its
specific requirements.

`rembg` needs its CPU backend (`rembg[cpu]`) and a `numba>=0.60` floor — without
the floor the resolver picks a legacy `numba` that fails to build.

## Model downloads

Models are downloaded on first use and cached locally. Typical sizes:

- Background removal (rembg u2net): ~170 MB
- Image classification (ViT): ~350 MB
- Image captioning (BLIP): ~900 MB
- Object detection (DETR): ~160 MB
- Text classification (DistilBERT): ~270 MB
- Named entity recognition (BERT NER): ~430 MB
- Sentence embeddings (MiniLM): ~90 MB
- Speech-to-text (Whisper base): ~140 MB

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Notes

- All models run on CPU. Inference can be slow for large models on long inputs.
- Background removal defaults to the established `u2net` model. Try
  `--model birefnet-general-lite` when speed and download size matter, or
  `birefnet-general` when output quality is more important.
- Speech-to-text uses CPU INT8 inference by default for reliable cross-platform
  performance on modest hardware. Windows on ARM falls back to OpenAI Whisper
  and requires an `ffmpeg` executable.
