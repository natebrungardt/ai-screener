import json
from openai import OpenAI
from app.core.config import OPENAI_API_KEY, OPENAI_MODEL
from app.core.prompt import _build_system_prompt, build_user_prompt
from app.models.schemas import EvaluationRequest, EvaluationResponse

client = OpenAI(api_key=OPENAI_API_KEY)

_SYSTEM_ACTIONS = {
    "auto_schedule": "Auto-Schedule Interview",
    "request_screening": "Request Additional Screening",
    "reject": "Reject Candidate",
}

_EMAIL_SUBJECTS = {
    "auto_schedule": "Let's set up a time to chat",
    "request_screening": "Next step in your application",
    "reject": "Your application update",
}

_EMAIL_TEMPLATES = {
    "auto_schedule": (
        "Hey {first_name}, loved your background — especially {strength}. "
        "We move fast here, so I wanted to reach out directly. "
        "I'd love to get 30 minutes on the calendar this week. "
        "Here's my scheduling link: [LINK]. Looking forward to it!"
    ),
    "request_screening_no_loom": (
        "Hey {first_name}, thanks for applying! Your experience in {strength} caught our eye. "
        "To help us get a better feel for your background, we'd love to see a short Loom video "
        "or hop on a quick phone screen — whichever works best for you. "
        "Just reply here and we'll get you set up."
    ),
    "request_screening_has_loom": (
        "Hey {first_name}, thanks for applying! Your experience in {strength} caught our eye. "
        "We'd love to connect for a quick 20-minute phone screen to learn more about you. "
        "Just reply here and we'll find a time that works."
    ),
    "reject": (
        "Hey {first_name}, appreciate you taking the time to apply. "
        "We went with someone whose background was a closer fit for where we are right now, "
        "but I'll keep your info on file for future openings. "
        "Best of luck with your search!"
    ),
}


def _extract_first_name(resume_text: str) -> str:
    for line in resume_text.splitlines():
        line = line.strip()
        if not line:
            continue

        if line.isupper():
            continue

        words = line.split()
        if len(words) >= 2:
            first = "".join(c for c in words[0] if c.isalpha())
            second = "".join(c for c in words[1] if c.isalpha())

            if first and second and first[0].isalpha():
                return first.capitalize()

    return "there"


def _derive_tier_action_confidence(score: int, has_loom: bool) -> tuple[str, str, float]:
    if score >= 80:
        tier = "high"
        action = "auto_schedule"
        confidence = 0.85 if has_loom else 0.70
    elif score >= 60:
        tier = "medium"
        if has_loom:
            action = "auto_schedule"
            confidence = 0.80
        else:
            action = "request_screening"
            confidence = 0.63
    else:
        tier = "low"
        action = "reject"
        confidence = 0.82 if has_loom else 0.67
    return tier, action, confidence


def _build_email(action: str, strengths: list[str], has_loom: bool, first_name: str = "there") -> str:
    strength_blurb = strengths[0].lower() if strengths else "your experience"
    if action == "request_screening":
        key = "request_screening_has_loom" if has_loom else "request_screening_no_loom"
    else:
        key = action
    return _EMAIL_TEMPLATES[key].format(strength=strength_blurb, first_name=first_name)


def _fallback(reason: str) -> EvaluationResponse:
    return EvaluationResponse(
        score=0,
        tier="low",
        reasoning=reason,
        strengths=[],
        weaknesses=["Evaluation could not be completed"],
        recommended_action="reject",
        confidence=0.0,
        system_action=_SYSTEM_ACTIONS["reject"],
        email_subject=_EMAIL_SUBJECTS["reject"],
        email_message=_build_email("reject", [], has_loom=False),
    )


def evaluate_candidate(req: EvaluationRequest) -> EvaluationResponse:
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt(req)},
                {"role": "user", "content": build_user_prompt(req)},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        raw = response.choices[0].message.content
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        return _fallback(f"AI returned malformed JSON: {e}")
    except Exception as e:
        return _fallback(f"OpenAI request failed: {e}")

    try:
        score = int(float(parsed.get("score", 0)))
    except (TypeError, ValueError):
        return _fallback("AI returned invalid score value")
    has_loom = bool(req.loom_transcript and req.loom_transcript.strip())
    tier, action, confidence = _derive_tier_action_confidence(score, has_loom)
    strengths = parsed.get("strengths") or []
    first_name = _extract_first_name(req.resume_text)

    return EvaluationResponse(
        score=score,
        tier=tier,
        reasoning=parsed.get("reasoning", ""),
        strengths=strengths,
        weaknesses=parsed.get("weaknesses") or [],
        recommended_action=action,
        confidence=confidence,
        system_action=_SYSTEM_ACTIONS[action],
        email_subject=_EMAIL_SUBJECTS[action],
        email_message=_build_email(action, strengths, has_loom, first_name),
    )
