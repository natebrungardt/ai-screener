# AI Screener

AI Screener is a lightweight MVP for evaluating job candidates against a job description using AI.

It automatically scores candidates, categorizes them by fit, and generates outreach emails based on the result.

---

## Repo Layout

- `frontend` — React + TypeScript frontend
- `backend` — FastAPI backend
- _(future)_ `services/worker` — async jobs (email queues, follow-ups)

---

## Run Locally

### 1. Run the Backend

```bash
cd backend
source .venv/bin/activate
fastapi dev main.py
```

If setting up the backend for the first time, create and activate a virtual environment, then install the needed packages:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn openai sendgrid python-dotenv
```

Backend URL:

```text
http://localhost:8000
```

---

### 2. Run the Web App

```bash
cd frontend
npm install
npm run dev
```

Web app URL:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
OPENAI_API_KEY=your_key_here
SENDGRID_API_KEY=your_key_here
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## How It Works

1. Input a job description and candidate resume
2. AI evaluates candidate fit
3. Returns:
   - Score (0–100)
   - Strengths / weaknesses
   - Reasoning
   - Recommended next step
4. Candidate is routed into one of three buckets:

- **High Fit (90–100)** → Invite to interview
- **Mid Tier (70–89)** → Request more info (Loom / phone screen)
- **Low Fit (<70)** → Reject

5. Email is generated and sent via SendGrid

---

## Current Features

- Resume vs job description scoring
- AI-generated reasoning
- Candidate routing logic
- Dynamic email generation
- SendGrid integration

---

## Tech Stack

- React + TypeScript
- FastAPI (Python)
- OpenAI API
- SendGrid

---

## Notes

This is a prototype built quickly (~2–3 hours) to demonstrate:

- Practical AI integration
- Speed of execution
- Product thinking around recruiting workflows

---

## Future Improvements

- Scoring calibration based on real hiring data
- Loom/video transcript analysis
- Follow-up automation
- ATS / job board integrations
