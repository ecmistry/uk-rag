/**
 * NHS Diagnosis Tool — server-side logic
 *
 * Uses Gemini (via Gravitee gateway, OpenAI-compatible chat/completions API)
 * to provide symptom assessment grounded in NHS guidelines.
 *
 * Admin-only — all tRPC procedures that call these functions are gated
 * behind adminProcedure.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TriageLevel =
  | "SELF_CARE"
  | "GP_ROUTINE"
  | "GP_URGENT"
  | "111"
  | "999";

export interface SymptomInput {
  symptoms: string;
  age: number;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  duration: string;
  medicalHistory?: string;
}

export interface PossibleCondition {
  name: string;
  nhsUrl: string;
  likelihood: "high" | "medium" | "low";
  explanation: string;
  keyFeatures: string[];
  triage: TriageLevel;
  redFlags: string[];
}

export interface DiagnosisResponse {
  conditions: PossibleCondition[];
  overallTriage: TriageLevel;
  redFlagsDetected: boolean;
  disclaimer: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Red-flag symptoms (hardcoded — never left to AI alone) ──────────────────

const RED_FLAG_SYMPTOMS = [
  // Cardiac
  "chest pain", "chest tightness", "pain radiating to arm", "pain radiating to jaw",
  // Neurological
  "sudden severe headache", "worst headache of my life", "thunderclap headache",
  "face drooping", "arm weakness", "slurred speech", "sudden confusion",
  // Respiratory
  "cannot breathe", "difficulty breathing", "lips turning blue",
  // Anaphylaxis
  "throat swelling", "tongue swelling", "severe allergic reaction",
  // Sepsis
  "mottled skin", "rash that does not fade", "glass test",
  // Self-harm
  "taken too many tablets", "overdose",
];

export function detectRedFlags(symptoms: string): string[] {
  const lower = symptoms.toLowerCase();
  return RED_FLAG_SYMPTOMS.filter((flag) => lower.includes(flag));
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const DIAGNOSIS_SYSTEM_PROMPT = `You are a clinical decision support assistant trained on NHS guidelines and public health data. Your role is to help patients understand possible causes of their symptoms and guide appropriate next steps — NOT to provide a diagnosis.

When given a patient's symptoms, age, and brief history:
1. Generate a ranked list of 3-5 possible conditions (most likely first)
2. For each condition, provide:
   - name: the condition name
   - nhsUrl: the NHS.uk URL (https://www.nhs.uk/conditions/{slug})
   - likelihood: "high", "medium", or "low"
   - explanation: plain English explanation of why it fits the symptoms
   - keyFeatures: array of distinguishing characteristics
   - triage: one of SELF_CARE, GP_ROUTINE, GP_URGENT, 111, 999
   - redFlags: array of symptoms that would escalate urgency
3. Also provide:
   - overallTriage: the most urgent triage level across all conditions
   - redFlagsDetected: boolean
   - disclaimer: a brief medical disclaimer

Rules:
- Use UK terminology (GP not physician, paracetamol not acetaminophen, A&E not ER)
- Never state a diagnosis. Always say "this could be consistent with..."
- Base conditions on NHS prevalence data for the UK population
- If ANY red-flag symptom is present (chest pain + breathlessness, sudden severe headache, signs of stroke, meningism, severe allergic reaction), set overallTriage to "999" and redFlagsDetected to true

CRITICAL: Respond ONLY with valid JSON matching this exact structure:
{
  "conditions": [...],
  "overallTriage": "...",
  "redFlagsDetected": false,
  "disclaimer": "...",
  "generatedAt": "ISO timestamp"
}`;

const CHAT_SYSTEM_PROMPT = `You are a patient-facing health information assistant for a UK audience. You help people understand a health condition they may have, based on NHS guidelines and publicly available medical information.

Rules:
- Use plain English. Avoid jargon unless you explain it.
- Always ground answers in NHS guidance where possible
- Provide the NHS URL for further reading when relevant (nhs.uk/conditions/...)
- Never prescribe or recommend specific medications by name without caveats
- If asked something outside your scope, redirect to NHS 111 or their GP
- Acknowledge uncertainty honestly — medicine is probabilistic
- UK English throughout
- Keep responses concise but thorough`;

// ─── Gemini API client (OpenAI-compatible via Gravitee gateway) ──────────────

const GATEWAY_URL = process.env.GRAVITEE_GEMINI_GATEWAY_URL ?? "";
const API_KEY = process.env.GRAVITEE_GEMINI_API_KEY ?? "";
const MODEL = "operations-gemini-api:gemini-2.0-flash";

interface GeminiChatCompletion {
  choices: Array<{
    message: { content: string; role: string };
    finish_reason: string;
  }>;
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  if (!GATEWAY_URL || !API_KEY) {
    throw new Error("Gemini API not configured — set GRAVITEE_GEMINI_GATEWAY_URL and GRAVITEE_GEMINI_API_KEY");
  }

  const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "X-Gravitee-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as GeminiChatCompletion;
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function diagnose(input: SymptomInput): Promise<DiagnosisResponse> {
  const detectedFlags = detectRedFlags(input.symptoms);

  // If red flags are detected, short-circuit with an immediate 999 response
  if (detectedFlags.length > 0) {
    return {
      conditions: [],
      overallTriage: "999",
      redFlagsDetected: true,
      disclaimer:
        "This tool provides health information only — it does not provide a medical diagnosis. " +
        "Red-flag symptoms have been detected. Please call 999 immediately or go to A&E.",
      generatedAt: new Date().toISOString(),
    };
  }

  const userMessage = `Patient details:
- Age: ${input.age}
- Gender: ${input.gender}
- Symptoms: ${input.symptoms}
- Duration: ${input.duration}
- Relevant history: ${input.medicalHistory || "None provided"}

Please assess these symptoms and return a DiagnosisResponse JSON object.`;

  const raw = await callGemini([
    { role: "system", content: DIAGNOSIS_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  // Extract JSON from the response (Gemini may wrap it in markdown code fences)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse diagnosis response from AI");
  }

  const parsed = JSON.parse(jsonMatch[0]) as DiagnosisResponse;

  // Ensure generatedAt is set
  if (!parsed.generatedAt) {
    parsed.generatedAt = new Date().toISOString();
  }

  // Safety net: re-check red flags in case the AI missed them
  if (detectedFlags.length > 0) {
    parsed.overallTriage = "999";
    parsed.redFlagsDetected = true;
  }

  return parsed;
}

export async function chat(
  messages: ChatMessage[],
  conditionContext?: string,
): Promise<string> {
  const systemContent = conditionContext
    ? `${CHAT_SYSTEM_PROMPT}\n\nContext: The patient has been given a possible condition from a symptom checker:\n${conditionContext}`
    : CHAT_SYSTEM_PROMPT;

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages.filter((m) => m.role !== "system"),
  ];

  return callGemini(fullMessages);
}
