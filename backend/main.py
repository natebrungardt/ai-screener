from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


class EvaluationRequest(BaseModel):
    job_description: str
    resume_text: str
    loom_transcript: Optional[str] = None


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/evaluate")
def evaluate(data: EvaluationRequest):
    return {
        "score": 85,
        "tier": "high",
        "strengths": ["clear communication", "relevant experience"],
        "weaknesses": ["limited outbound experience"],
        "recommended_action": "fast_track_interview",
    }
