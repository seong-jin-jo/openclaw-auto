from fastapi import FastAPI
from pydantic import BaseModel
from diffusers import StableDiffusionPipeline
import torch
from fastapi.responses import FileResponse
import uuid

# -----------------------------
# FastAPI 서버 생성
# -----------------------------
app = FastAPI()

# -----------------------------
# 요청 데이터 형식 정의
# -----------------------------
class PromptRequest(BaseModel):
    prompt: str


# -----------------------------
# 모델 로딩 (서버 시작시 1회)
# -----------------------------
model_id = "runwayml/stable-diffusion-v1-5"

pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16
)

pipe = pipe.to("cuda")


# -----------------------------
# 이미지 생성 API
# -----------------------------
@app.post("/generate")
def generate_image(req: PromptRequest):

    prompt = req.prompt

    image = pipe(prompt).images[0]

    filename = f"{uuid.uuid4()}.png"
    image.save(filename)

    return FileResponse(filename)
