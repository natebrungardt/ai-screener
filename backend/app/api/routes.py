from fastapi import APIRouter, HTTPException
from app.models.schemas import EvaluationRequest, EvaluationResponse, SendEmailRequest
from app.services.evaluator import evaluate_candidate
from app.services.email_service import send_email

router = APIRouter()


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate(data: EvaluationRequest) -> EvaluationResponse:
    return evaluate_candidate(data)


@router.post("/send-email")
def send_candidate_email(data: SendEmailRequest) -> dict:
    try:
        send_email(data.to_email, data.subject, data.body)
        return {"sent": True}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
