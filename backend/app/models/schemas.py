from typing import Literal, Optional
from pydantic import BaseModel


class EvaluationRequest(BaseModel):
    job_description: str
    resume_text: str
    loom_transcript: Optional[str] = None
    role_focus: Optional[str] = None
    candidate_email: Optional[str] = None


class EvaluationResponse(BaseModel):
    score: int
    tier: Literal["high", "medium", "low"]
    reasoning: str
    strengths: list[str]
    weaknesses: list[str]
    recommended_action: Literal["auto_schedule", "request_screening", "reject"]
    confidence: float
    system_action: str
    email_subject: str
    email_message: str


class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
