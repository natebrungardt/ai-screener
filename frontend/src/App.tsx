import { useState } from "react";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [loom, setLoom] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    const res = await fetch("http://127.0.0.1:8000/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_description: jobDescription,
        resume_text: resume,
        loom_transcript: loom,
      }),
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Screener</h1>

      <textarea
        placeholder="Job Description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={5}
        style={{ width: "100%" }}
      />

      <textarea
        placeholder="Resume"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        rows={5}
        style={{ width: "100%", marginTop: 10 }}
      />

      <textarea
        placeholder="Loom Transcript (optional)"
        value={loom}
        onChange={(e) => setLoom(e.target.value)}
        rows={5}
        style={{ width: "100%", marginTop: 10 }}
      />

      <button onClick={handleSubmit} style={{ marginTop: 10 }}>
        Evaluate
      </button>

      {result && (
        <pre style={{ marginTop: 20 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
