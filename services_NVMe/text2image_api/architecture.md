\# AI Product Systems Lab — Text-to-Image Inference Service



\## Purpose



This repository documents the architecture, infrastructure decisions, and operational behavior of a diffusion-based AI image generation service.



The goal is not only to run a model, but to demonstrate:



\* Understanding of modern generative AI system pipelines

\* Ability to integrate research models into production APIs

\* GPU inference behavior and bottleneck analysis

\* Engineering trade-offs when deploying AI services



This serves as a technical learning log and capability proof for building AI-powered products.



---



\# System Overview



The service exposes an HTTP API that converts text prompts into images using a diffusion model executed on GPU.



High-level flow:



```

Client

&nbsp; ↓

HTTP Request (POST /generate)

&nbsp; ↓

FastAPI Server

&nbsp; ↓

Diffusion Pipeline (tokenizer + model)

&nbsp; ↓

PyTorch CUDA Execution

&nbsp; ↓

Image Generation

&nbsp; ↓

PNG Response

```



---



\# Core Concepts



\## 1. Diffusion Model Architecture



The model used is Stable Diffusion, which operates in \*\*latent space\*\* rather than pixel space.



Pipeline stages:



\### 1️⃣ Text Tokenization



Input text prompt is converted into tokens.



Purpose:



\* Convert human language into numerical representation



Component:



\* CLIP Tokenizer



Output:



\* Token IDs



---



\### 2️⃣ Text Encoding



Tokens are transformed into semantic embeddings.



Component:



\* CLIP Text Encoder



Output:



\* Text embedding vector representing prompt meaning



This embedding guides image generation.



---



\### 3️⃣ Latent Noise Initialization



Instead of generating pixels directly, the system starts with random noise in latent space.



Why:



\* Computationally cheaper than pixel space

\* Enables efficient diffusion process



---



\### 4️⃣ U-Net Diffusion Process



Core of the model.



The U-Net repeatedly removes noise from the latent representation while being conditioned on text embeddings.



Process:



```

Noise → Less Noise → Structured Representation → Image Latent

```



This step runs multiple iterations (typically 20–50).



Most GPU computation occurs here.



---



\### 5️⃣ VAE Decoder



Final latent representation is converted into pixel image.



Component:



\* Variational Autoencoder (Decoder)



Output:



\* RGB image



---



\# Why Latent Diffusion?



Advantages:



\* Lower GPU memory usage

\* Faster inference

\* Higher resolution capability

\* Practical for consumer GPUs



This is why Stable Diffusion became widely adopted.



---



\# Engineering Architecture



\## API Layer



Framework:



\* FastAPI



Responsibilities:



\* Request validation

\* Prompt handling

\* Model invocation

\* Binary image response



Why FastAPI:



\* Async support

\* High performance

\* Automatic OpenAPI docs

\* Common in ML production systems



---



\## Inference Engine



Libraries:



\* Diffusers

\* PyTorch

\* CUDA



Responsibilities:



\* Model loading

\* GPU execution

\* Tensor operations

\* Memory management



---



\## GPU Execution



Computation path:



```

Python → PyTorch → CUDA kernels → GPU

```



Important observations:



\* First inference is slow due to model loading

\* Subsequent inference is faster

\* GPU VRAM is the main constraint

\* Memory fragmentation can cause failures



---



\# Model Loading Behavior



The model downloads on first run because:



\* We load from HuggingFace Hub

\* We do not ship weights inside repository



Cache location:



```

C:\\Users\\User\\.cache\\huggingface

```



Production systems usually:



\* Pre-download models

\* Mount persistent storage

\* Or bake into Docker images



---



\# Performance Characteristics



Typical inference time (RTX 2070):



| Step                   | Time   |

| ---------------------- | ------ |

| Model load (first run) | 30–60s |

| Inference (30 steps)   | 4–8s   |

| Subsequent requests    | 3–6s   |



Main bottleneck:



> U-Net diffusion iterations



---



\# Operational Considerations



Important production concerns discovered during testing:



\### Cold Start Latency



First request triggers:



\* Model download

\* GPU memory allocation

\* CUDA kernel initialization



Mitigation:



\* Warm-up request

\* Persistent workers



---



\### GPU Memory Constraints



OOM errors occur when:



\* Resolution increases

\* Batch size increases

\* Multiple models loaded



Solutions:



\* Half precision (fp16)

\* Attention slicing

\* Model offloading



---



\### Windows Symlink Warning



HuggingFace cache uses symlinks for efficiency.



Windows requires:



\* Developer mode

&nbsp; or

\* Admin privileges



This does not affect correctness.



---



\# API Specification



Endpoint:



```

POST /generate

```



Request:



```json

{

&nbsp; "prompt": "a futuristic city at night"

}

```



Response:



\* PNG image



---



\# Example Usage



```bash

curl -X POST http://127.0.0.1:8000/generate \\

&nbsp;-H "Content-Type: application/json" \\

&nbsp;-d "{\\"prompt\\": \\"a futuristic city\\"}" \\

&nbsp;--output result.png

```



---



\# Key Engineering Learnings



Through this project:



\* Understanding diffusion inference pipeline

\* GPU execution flow in PyTorch

\* Model loading and caching mechanics

\* API integration of AI models

\* Latency and memory trade-offs

\* Deployment considerations for AI services



---



\# Future Improvements



Planned extensions:



\* Parameterized inference (steps, guidance scale)

\* LoRA fine-tuning integration

\* Text-to-video inference

\* Docker deployment

\* Multi-GPU serving

\* Quantization optimization



---



\# Why This Matters



Modern AI products are not only about training models.



The real value lies in:



> Integrating models into reliable, scalable systems.



This repository demonstrates the ability to move from research artifacts to usable product infrastructure.



---



\# License



For research and educational purposes.



