/**
 * NHS Diagnosis Tool — server-side logic
 *
 * Uses Gemini (via Gravitee gateway, OpenAI-compatible chat/completions API)
 * to provide symptom assessment grounded in NHS guidelines.
 *
 * Enrichment layers:
 *  1. NHS Website Content API — validates conditions and pulls real NHS content
 *  2. Structured red-flag knowledge base — hardcoded emergency detection
 *  3. UK prevalence data embedded in system prompt
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
  nhsContent?: string;
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
// Organised by body system for comprehensive coverage

const RED_FLAGS: Record<string, string[]> = {
  cardiac: [
    "chest pain", "chest tightness", "chest pressure",
    "pain radiating to arm", "pain radiating to jaw",
    "crushing chest pain", "heart attack",
  ],
  neurological: [
    "sudden severe headache", "worst headache of my life", "thunderclap headache",
    "face drooping", "arm weakness", "slurred speech", "sudden confusion",
    "sudden loss of vision", "sudden numbness", "seizure", "fitting",
    "loss of consciousness", "unresponsive",
  ],
  respiratory: [
    "cannot breathe", "can't breathe", "difficulty breathing",
    "struggling to breathe", "lips turning blue", "blue lips",
    "choking", "coughing up blood",
  ],
  anaphylaxis: [
    "throat swelling", "tongue swelling", "severe allergic reaction",
    "throat closing", "face swelling rapidly",
  ],
  sepsis: [
    "mottled skin", "rash that does not fade", "glass test",
    "rash does not fade", "non-blanching rash",
  ],
  paediatric: [
    "baby not breathing", "child not breathing",
    "baby floppy", "child floppy", "bulging fontanelle",
    "baby not feeding", "infant not responding",
  ],
  pregnancy: [
    "heavy vaginal bleeding pregnant", "severe abdominal pain pregnant",
    "waters broken early", "premature labour",
  ],
  mental_health: [
    "taken too many tablets", "overdose",
    "want to end my life", "going to kill myself",
    "self harm", "suicide",
  ],
  trauma: [
    "severe bleeding", "arterial bleeding", "blood spurting",
    "broken bone sticking out", "compound fracture",
    "severe burn", "head injury unconscious",
  ],
  stroke: [
    "face arm speech", "fast test", "stroke symptoms",
    "one side of face drooping", "cannot lift arm",
    "speech garbled", "sudden weakness one side",
  ],
};

const ALL_RED_FLAG_SYMPTOMS = Object.values(RED_FLAGS).flat();

export function detectRedFlags(symptoms: string): string[] {
  const lower = symptoms.toLowerCase();
  return ALL_RED_FLAG_SYMPTOMS.filter((flag) => lower.includes(flag));
}

// ─── NHS Website Content API ─────────────────────────────────────────────────

const NHS_API_BASE = "https://api.service.nhs.uk/nhs-website-content";
const NHS_API_KEY = process.env.NHS_API_KEY ?? "";

interface NhsConditionSummary {
  name: string;
  url: string;
  description: string;
}

/**
 * Search NHS Website Content API for a condition.
 * Returns null if the API is unavailable or the condition isn't found.
 */
async function searchNhsCondition(conditionName: string): Promise<NhsConditionSummary | null> {
  if (!NHS_API_KEY) return null;

  try {
    const slug = conditionName
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const res = await fetch(`${NHS_API_BASE}/conditions/${slug}`, {
      headers: { apikey: NHS_API_KEY },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name ?? conditionName,
        url: data.url ?? `https://www.nhs.uk/conditions/${slug}/`,
        description: data.description ?? "",
      };
    }

    // Try search endpoint as fallback
    const searchRes = await fetch(
      `${NHS_API_BASE}/conditions?search=${encodeURIComponent(conditionName)}`,
      {
        headers: { apikey: NHS_API_KEY },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const results = searchData?.significantLink ?? searchData?.results ?? [];
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        return {
          name: first.name ?? first.mainEntityOfPage?.name ?? conditionName,
          url: first.url ?? first.mainEntityOfPage?.["@id"] ?? `https://www.nhs.uk/conditions/${slug}/`,
          description: first.description ?? "",
        };
      }
    }
  } catch {
    // NHS API unavailable — degrade gracefully
  }

  return null;
}

/**
 * Enrich AI-returned conditions with real NHS data.
 * Validates URLs, pulls descriptions, and corrects names.
 */
async function enrichConditions(conditions: PossibleCondition[]): Promise<PossibleCondition[]> {
  const enriched = await Promise.allSettled(
    conditions.map(async (c) => {
      const nhsData = await searchNhsCondition(c.name);
      if (nhsData) {
        return {
          ...c,
          nhsUrl: nhsData.url,
          nhsContent: nhsData.description || undefined,
        };
      }
      return c;
    }),
  );

  return enriched.map((r, i) =>
    r.status === "fulfilled" ? r.value : conditions[i],
  );
}

// ─── UK prevalence context ───────────────────────────────────────────────────
// QOF 2023/24 + NHS Digital prevalence estimates per 1000 registered patients

const UK_PREVALENCE_CONTEXT = `
UK Prevalence Data (QOF 2023/24 — GP-registered patients):
- Hypertension: 140/1000 (very common, increases with age)
- Depression: 130/1000 (very common)
- Asthma: 70/1000 (common, especially in children)
- Diabetes (Type 2): 55/1000 (common, increases with age and BMI)
- COPD: 20/1000 (common in over-40s, linked to smoking)
- Coronary Heart Disease: 30/1000 (increases sharply over 50)
- Atrial Fibrillation: 22/1000
- Heart Failure: 10/1000
- Stroke/TIA: 18/1000
- Epilepsy: 8/1000
- Dementia: 9/1000 (higher in over-65s)
- Cancer (all): 32/1000
- CKD (stages 3-5): 40/1000
- Rheumatoid Arthritis: 8/1000
- Osteoporosis: recorded fragility fractures 7/1000

Common presentations in UK primary care (annual GP consultation rates):
- Upper respiratory tract infections: ~150/1000/year
- Back pain: ~60/1000/year
- Urinary tract infections: ~30/1000/year (much higher in women)
- Skin conditions (eczema, dermatitis): ~50/1000/year
- Anxiety disorders: ~40/1000/year
- Gastro-oesophageal reflux: ~25/1000/year
- Musculoskeletal injuries: ~40/1000/year
- Headaches/migraines: ~20/1000/year

Always prefer common conditions over rare ones unless specific red-flag features point to a rarer diagnosis.
`;

// ─── Prompts ─────────────────────────────────────────────────────────────────

const DIAGNOSIS_SYSTEM_PROMPT = `You are a clinical decision support assistant trained on NHS guidelines, NICE Clinical Knowledge Summaries (CKS), and UK public health data. Your role is to help patients understand possible causes of their symptoms and guide appropriate next steps — NOT to provide a diagnosis.

${UK_PREVALENCE_CONTEXT}

NHS Triage Escalation Rules (from NHS Pathways):
- 999/A&E: Life-threatening symptoms, loss of consciousness, signs of stroke (FAST), anaphylaxis, severe breathing difficulty, chest pain with cardiac features, active severe bleeding, suspected meningitis (non-blanching rash + fever + headache/neck stiffness)
- 111: Symptoms needing same-day medical assessment but not immediately life-threatening; moderate breathing difficulty; persistent vomiting in children; significant new symptoms in pregnancy
- GP Urgent: Worsening symptoms over days; suspected infections needing antibiotics; moderate pain; new lumps; significant weight loss
- GP Routine: Symptoms present for >2 weeks that are not worsening; follow-up of known conditions; preventive care
- Self-care: Mild, self-limiting symptoms consistent with common viral illness; minor injuries; mild musculoskeletal pain

When given a patient's symptoms, age, and brief history:
1. Generate a ranked list of 3-5 possible conditions (most likely first, based on UK prevalence)
2. For each condition, provide:
   - name: the condition name (use the name NHS.uk uses)
   - nhsUrl: the NHS.uk URL (https://www.nhs.uk/conditions/{slug})
   - likelihood: "high", "medium", or "low" — calibrated against UK prevalence
   - explanation: plain English explanation of why it fits the symptoms (start with "This could be consistent with...")
   - keyFeatures: array of distinguishing characteristics that would help differentiate
   - triage: one of SELF_CARE, GP_ROUTINE, GP_URGENT, 111, 999
   - redFlags: symptoms that, if they developed, would escalate urgency
3. Also provide:
   - overallTriage: the most urgent triage level across all conditions
   - redFlagsDetected: boolean
   - disclaimer: a brief medical disclaimer

Age-specific considerations:
- Under 5: lower threshold for escalation; consider safeguarding
- Over 65: increased risk of atypical presentations; comorbidity more likely
- Pregnancy: many conditions present differently; lower escalation threshold

Rules:
- Use UK terminology (GP not physician, paracetamol not acetaminophen, A&E not ER)
- Never state a diagnosis. Always say "this could be consistent with..."
- Prefer common conditions over rare ones (use the prevalence data above)
- Consider the patient's age and gender in your assessment
- If ANY red-flag symptom is present, set overallTriage to "999" and redFlagsDetected to true

CRITICAL: Respond ONLY with valid JSON matching this exact structure:
{
  "conditions": [...],
  "overallTriage": "...",
  "redFlagsDetected": false,
  "disclaimer": "...",
  "generatedAt": "ISO timestamp"
}`;

const CHAT_SYSTEM_PROMPT = `You are a patient-facing health information assistant for a UK audience. You help people understand a health condition they may have, based on NHS guidelines, NICE Clinical Knowledge Summaries (CKS), and publicly available medical information.

${UK_PREVALENCE_CONTEXT}

Rules:
- Use plain English. Avoid jargon unless you explain it.
- Always ground answers in NHS guidance where possible
- Provide the NHS.uk URL for further reading when relevant (nhs.uk/conditions/...)
- Reference NICE CKS (cks.nice.org.uk) for GP-level clinical detail when appropriate
- Never prescribe or recommend specific medications by name without caveats
- When discussing treatments, mention both NHS self-care advice and when to escalate
- If asked something outside your scope, redirect to NHS 111 or their GP
- Acknowledge uncertainty honestly — medicine is probabilistic
- UK English throughout
- Keep responses concise but thorough
- If the patient mentions new symptoms that could be red flags, always advise seeking immediate medical attention`;

// ─── Gemini API client (OpenAI-compatible via Gravitee gateway) ──────────────

const GATEWAY_URL = process.env.GRAVITEE_GEMINI_GATEWAY_URL ?? "";
const GEMINI_KEY = process.env.GRAVITEE_GEMINI_API_KEY ?? "";
const MODEL = "operations-gemini-api:gemini-2.0-flash";

interface GeminiChatCompletion {
  choices: Array<{
    message: { content: string; role: string };
    finish_reason: string;
  }>;
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  if (!GATEWAY_URL || !GEMINI_KEY) {
    throw new Error("Gemini API not configured — set GRAVITEE_GEMINI_GATEWAY_URL and GRAVITEE_GEMINI_API_KEY");
  }

  const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "X-Gravitee-Api-Key": GEMINI_KEY,
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

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse diagnosis response from AI");
  }

  const parsed = JSON.parse(jsonMatch[0]) as DiagnosisResponse;

  if (!parsed.generatedAt) {
    parsed.generatedAt = new Date().toISOString();
  }

  // Safety net: re-check red flags
  if (detectedFlags.length > 0) {
    parsed.overallTriage = "999";
    parsed.redFlagsDetected = true;
  }

  // Enrich with real NHS data (non-blocking — falls back gracefully)
  if (parsed.conditions?.length > 0) {
    try {
      parsed.conditions = await enrichConditions(parsed.conditions);
    } catch {
      // enrichment failed — continue with AI-only results
    }
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
