import { useState } from "react";
import ResumeInput from "./components/ResumeInput";
import ResultCard from "./components/ResultCard";
import { evaluateCandidate } from "./services/api";
import type { EvaluationResponse } from "./types/evaluation";
import "./styles/global.css";

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loomTranscript, setLoomTranscript] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = jobDescription.trim() && resumeText.trim() && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await evaluateCandidate({
        job_description: jobDescription,
        resume_text: resumeText,
        loom_transcript: loomTranscript || undefined,
        candidate_email: candidateEmail || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <h1 className="header__title">AI Candidate Screener</h1>
        <p className="header__subtitle">
          Paste a job description and resume to get an instant structured evaluation.
        </p>
      </header>

      <main className="main">
        <section className="card input-card">
          <div className="field">
            <label className="field__label" htmlFor="job-description">
              Job Description
            </label>
            <textarea
              id="job-description"
              className="field__textarea"
              placeholder="Paste the job description here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          <div className="field">
            <label className="field__label">Resume</label>
            <ResumeInput onChange={setResumeText} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="loom-transcript">
              Loom Transcript{" "}
              <span className="field__label--optional">(optional)</span>
            </label>
            <p className="field__hint">
              Optional: Add a Loom transcript to improve evaluation accuracy and confidence
            </p>
            <textarea
              id="loom-transcript"
              className="field__textarea"
              placeholder="Paste Loom transcript here…"
              value={loomTranscript}
              onChange={(e) => setLoomTranscript(e.target.value)}
              rows={4}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="candidate-email">
              Candidate Email{" "}
              <span className="field__label--optional">(optional)</span>
            </label>
            <input
              id="candidate-email"
              className="field__input"
              type="email"
              placeholder="candidate@example.com"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            className="btn-evaluate"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <span className="btn-evaluate__spinner" aria-hidden="true" />
                Evaluating…
              </>
            ) : (
              "Evaluate Candidate"
            )}
          </button>
        </section>

        {result && (
          <ResultCard result={result} candidateEmail={candidateEmail || undefined} />
        )}
      </main>
    </div>
  );
}
