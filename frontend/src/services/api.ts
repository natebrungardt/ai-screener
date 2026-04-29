import type { EvaluationRequest, EvaluationResponse } from "../types/evaluation";

const BASE_URL = "http://localhost:8000";

export async function evaluateCandidate(
  data: EvaluationRequest
): Promise<EvaluationResponse> {
  const res = await fetch(`${BASE_URL}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function sendCandidateEmail(
  toEmail: string,
  subject: string,
  body: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to_email: toEmail, subject, body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Email failed: ${res.status}`);
  }
}
