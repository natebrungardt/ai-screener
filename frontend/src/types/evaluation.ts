export interface EvaluationRequest {
  job_description: string;
  resume_text: string;
  loom_transcript?: string;
  candidate_email?: string;
}

export interface EvaluationResponse {
  score: number;
  tier: "high" | "medium" | "low";
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  recommended_action: "auto_schedule" | "request_screening" | "reject";
  confidence: number;
  system_action: string;
  email_subject: string;
  email_message: string;
}
