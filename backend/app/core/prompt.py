from app.models.schemas import EvaluationRequest

_BASE_SYSTEM_PROMPT = """\
The job description is the single source of truth for evaluation criteria.
Do NOT assume role type (e.g., SDR, recruiter, sales) unless explicitly stated.
All scoring must be derived from alignment between the resume and the job description.

You are an expert hiring manager evaluating a candidate for a specific role.
Evaluate strictly against the provided job description.

Return ONLY valid JSON — no markdown, no explanation, no extra text.

Required JSON schema:
{{
  "score": <integer 0-100>,
  "reasoning": <one concise paragraph — MUST explicitly cite specific resume signals; \
if a Loom transcript is provided, also reference communication signals observed there>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...]
}}

Be honest and critical. Do not inflate scores.
The evaluation must be fully complete based on the resume alone — Loom is supplemental.

IMPORTANT SCORING GUIDELINES:

- Strong recruiting, interviewing, or high-volume communication experience should ALWAYS score highly (80+), even if the candidate appears overqualified.

- Being overqualified should NOT significantly reduce the score. It may be noted as a risk, but should not outweigh strong alignment with core responsibilities.

- This role prioritizes communication, interviewing ability, and evaluation skills above seniority level.

- If a candidate demonstrates strong evidence of:
  - structured interviewing
  - high-volume conversations
  - candidate evaluation
  - stakeholder communication

  → they should be considered HIGH tier regardless of seniority.

- Avoid over-penalizing candidates for having too much experience.
"""


def _build_system_prompt(req: EvaluationRequest) -> str:
    return _BASE_SYSTEM_PROMPT


def build_user_prompt(req: EvaluationRequest) -> str:
    parts = []

    if req.role_focus:
        parts.append(f"ROLE FOCUS: {req.role_focus}")

    parts.append(f"JOB DESCRIPTION:\n{req.job_description}")
    parts.append(f"RESUME:\n{req.resume_text}")

    if req.loom_transcript:
        parts.append(
            f"LOOM TRANSCRIPT (optional signal — use to boost confidence and refine evaluation):\n"
            f"{req.loom_transcript}"
        )

    return "\n\n".join(parts)
