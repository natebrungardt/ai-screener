import { useState } from "react";
import type { EvaluationResponse } from "../types/evaluation";
import { sendCandidateEmail } from "../services/api";

const ACTION_LABELS: Record<EvaluationResponse["recommended_action"], string> = {
  auto_schedule: "Auto-Schedule Interview",
  request_screening: "Request Additional Screening",
  reject: "Reject Candidate",
};

const TIER_LABELS: Record<EvaluationResponse["tier"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface Props {
  result: EvaluationResponse;
  candidateEmail?: string;
}

export default function ResultCard({ result, candidateEmail }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const confidencePct = Math.round(result.confidence * 100);

  async function handleSendEmail() {
    if (!candidateEmail) return;
    setSending(true);
    setSendError(null);
    try {
      await sendCandidateEmail(candidateEmail, result.email_subject, result.email_message);
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-score">
          <span className="result-score__number">{result.score}</span>
          <span className="result-score__label">/ 100</span>
        </div>
        <div className="result-meta">
          <span className={`tier-badge tier-badge--${result.tier}`}>
            {TIER_LABELS[result.tier]}
          </span>
          <span className="confidence">
            <span className="confidence__label">Confidence</span>
            <span className="confidence__value">{confidencePct}%</span>
          </span>
        </div>
      </div>

      <div className="result-action">
        <span className="result-action__label">Recommended Next Step</span>
        <span className={`result-action__value result-action__value--${result.recommended_action}`}>
          {ACTION_LABELS[result.recommended_action]}
        </span>
      </div>

      <div className="result-lists">
        <div className="result-list">
          <h3 className="result-list__title result-list__title--strengths">Strengths</h3>
          <ul className="result-list__items">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="result-list">
          <h3 className="result-list__title result-list__title--weaknesses">Weaknesses</h3>
          <ul className="result-list__items">
            {result.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {result.reasoning && (
        <div className="result-reasoning">
          <h3 className="result-reasoning__title">Reasoning</h3>
          <p className="result-reasoning__text">{result.reasoning}</p>
        </div>
      )}

      {result.email_message && (
        <div className="result-email">
          <h3 className="result-email__title">Draft Email</h3>
          <p className="result-email__body">{result.email_message}</p>
          {candidateEmail && (
            <div className="result-email__actions">
              {sent ? (
                <span className="result-email__sent">Email sent to {candidateEmail}</span>
              ) : (
                <>
                  <button
                    className="btn-send-email"
                    onClick={handleSendEmail}
                    disabled={sending}
                  >
                    {sending ? "Sending…" : `Send to ${candidateEmail}`}
                  </button>
                  {sendError && <p className="result-email__error">{sendError}</p>}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
