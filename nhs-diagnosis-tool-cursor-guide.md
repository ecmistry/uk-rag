# NHS Self-Diagnosis Tool — Cursor Build Guide
### MVP: Patient Symptom Checker & Illness Q&A, Grounded in Public NHS Data

---

## What You're Building

A web application where a patient can:
1. **Enter symptoms** in plain English (or select from structured options)
2. **Receive a ranked list of possible conditions** with explanations
3. **Ask follow-up questions** about their illness in a conversational interface
4. **Get triage guidance** (self-care / GP / urgent care / A&E)

This MVP uses **only publicly available data** — no patient-level NHS records, no data access agreements required. It's a legally clean starting point that can be upgraded later with richer NHS data partnerships.

---

## Tech Stack (Cursor-Friendly)

```
Frontend:    Next.js 14 (App Router) + Tailwind CSS
Backend:     Next.js API Routes (serverless)
AI Layer:    Anthropic Claude API (claude-sonnet-4-20250514)
Data Layer:  NHS public APIs + embedded knowledge base
Deployment:  Vercel (free tier to start)
Language:    TypeScript throughout
```

**Why this stack?**
- Next.js gives you frontend + backend in one repo — Cursor handles this well
- Claude via API gives you medical reasoning out of the box
- NHS APIs are free, RESTful, and well-documented
- Vercel deployment is one command

---

## Folder Structure

```
nhs-symptom-checker/
├── app/
│   ├── page.tsx                  # Landing / symptom entry
│   ├── results/page.tsx          # Condition results page
│   ├── chat/page.tsx             # Follow-up Q&A chat interface
│   └── api/
│       ├── diagnose/route.ts     # Symptom → conditions (Claude)
│       ├── chat/route.ts         # Conversational follow-up (Claude)
│       └── nhs-conditions/route.ts  # NHS API proxy
├── components/
│   ├── SymptomInput.tsx          # Free text + structured selector
│   ├── ConditionCard.tsx         # Result card with NHS link
│   ├── TriageBadge.tsx           # Urgency indicator
│   ├── ChatWindow.tsx            # Conversation interface
│   └── DisclaimerBanner.tsx      # Legal/medical disclaimer (critical)
├── lib/
│   ├── claude.ts                 # Claude API client
│   ├── nhs-api.ts               # NHS API wrapper
│   ├── prompts.ts               # System prompts (keep these versioned)
│   └── triage.ts                # Triage logic
├── data/
│   ├── conditions.json           # Cached NHS conditions + symptoms
│   ├── red-flags.json            # Symptoms requiring immediate care
│   └── nice-guidelines.json     # Scraped NICE guidance summaries
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.local                    # API keys (never commit)
└── README.md
```

---

## Data Sources (All Free, All Public)

### 1. NHS API — Conditions & Symptoms
**Primary data source for condition information.**

- **Base URL:** `https://api.nhs.uk/conditions`
- **Docs:** https://developer.api.nhs.uk/nhs-api
- **Get API Key:** https://developer.api.nhs.uk/nhs-api (free registration)
- **What it gives you:** Structured condition pages, symptoms lists, treatments, when-to-see-a-GP guidance, links to full NHS.uk articles

```typescript
// lib/nhs-api.ts
const NHS_API_KEY = process.env.NHS_API_KEY;
const BASE_URL = 'https://api.nhs.uk';

export async function getCondition(conditionSlug: string) {
  const res = await fetch(`${BASE_URL}/conditions/${conditionSlug}`, {
    headers: { 'subscription-key': NHS_API_KEY! }
  });
  return res.json();
}

export async function searchConditions(query: string) {
  const res = await fetch(
    `${BASE_URL}/conditions?search=${encodeURIComponent(query)}`,
    { headers: { 'subscription-key': NHS_API_KEY! } }
  );
  return res.json();
}
```

### 2. NHS 111 Online Clinical Pathways (Embedded Knowledge)
NHS 111's triage logic is publicly documented. Use it to build your triage classification.

- **111 Online:** https://111.nhs.uk
- **Clinical Decision Support:** Based on NHS Pathways (the same system used by 111 call handlers)
- **NHS Pathways docs:** https://digital.nhs.uk/services/nhs-pathways
- **Strategy:** Hardcode red-flag symptoms that always escalate to A&E; use Claude for the middle tier

### 3. NICE Guidelines (Scraped/Summarised)
NICE publishes all clinical guidelines as open HTML — you can scrape, summarise with Claude, and embed.

- **NICE Conditions A-Z:** https://www.nice.org.uk/guidance/conditions-and-diseases
- **NICE BNF (drug info):** https://bnf.nice.org.uk
- **NICE CKS (GP-level summaries):** https://cks.nice.org.uk — *this is gold*. Primary care clinical knowledge summaries, exactly the level of detail you want for a GP-adjacent tool.
- **Licence:** Open Government Licence — free to use, must attribute

### 4. OpenPrescribing API (Prescribing Data)
Useful for validating condition prevalence and linking conditions to treatments.

- **API:** https://openprescribing.net/api/
- **Docs:** https://openprescribing.net/api/1.0/
- **Useful endpoint:** `/spending_by_ccg/` — shows what GPs are prescribing for conditions by region

### 5. NHS Digital Open Data (Condition Prevalence)
- **QOF (Quality & Outcomes Framework):** https://digital.nhs.uk/data-and-information/publications/statistical/quality-and-outcomes-framework
  - Contains GP-registered prevalence rates for 70+ conditions (diabetes, hypertension, asthma, depression, etc.)
  - Useful for calibrating how common a condition is in the UK
- **NHSBSA Open Data Portal:** https://opendata.nhsbsa.net

### 6. Human Phenotype Ontology (HPO)
A structured vocabulary of symptoms mapped to conditions. Used by clinical AI tools globally.

- **Source:** https://hpo.jax.org/app/
- **Downloads:** https://hpo.jax.org/app/data/annotations
- **What it gives you:** ~18,000 symptoms with their associated conditions, structured for machine use

---

## The Claude Prompts (Core Logic)

Version-control these carefully — they're your product's intellectual property.

### System Prompt: Symptom → Differential Diagnosis

```typescript
// lib/prompts.ts

export const DIAGNOSIS_SYSTEM_PROMPT = `
You are a clinical decision support assistant trained on NHS guidelines and 
public health data. Your role is to help patients understand possible causes 
of their symptoms and guide appropriate next steps — NOT to provide a diagnosis.

You have access to NHS Conditions data and NICE Clinical Knowledge Summaries.

When given a patient's symptoms, age, and brief history:
1. Generate a ranked list of 3-5 possible conditions (most likely first)
2. For each condition, provide:
   - Plain English explanation of why it fits the symptoms
   - Key distinguishing features
   - NHS triage recommendation: SELF_CARE | GP_ROUTINE | GP_URGENT | 111 | 999
3. Always flag red-flag symptoms that require immediate escalation
4. Use UK terminology (e.g., "GP" not "physician", "paracetamol" not "acetaminophen")
5. Never state a diagnosis. Always say "this could be consistent with..."
6. Always end with: recommend the patient discuss with their GP or call 111

Output as structured JSON matching the DiagnosisResponse type.
Conditions should be based on NHS prevalence data for the UK population.

CRITICAL: If any red-flag symptom is present (chest pain + breathlessness, 
sudden severe headache, signs of stroke, meningism, severe allergic reaction),
immediately return triage: "999" and do not speculate on conditions.
`;

export const CHAT_SYSTEM_PROMPT = `
You are a patient-facing health information assistant for a UK audience.
You help people understand a health condition they may have, based on 
NHS guidelines and publicly available medical information.

Context: The patient has been given a possible condition from a symptom checker.
Your role is to answer their follow-up questions clearly and honestly.

Rules:
- Use plain English. Avoid jargon unless you explain it.
- Always ground answers in NHS guidance where possible
- Provide the NHS URL for further reading when relevant (nhs.uk/conditions/...)  
- Never prescribe or recommend specific medications by name without caveats
- If asked something outside your scope, redirect to NHS 111 or their GP
- Acknowledge uncertainty honestly — medicine is probabilistic
- UK English throughout
`;
```

### API Route: Diagnosis

```typescript
// app/api/diagnose/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { DIAGNOSIS_SYSTEM_PROMPT } from '@/lib/prompts';

const client = new Anthropic();

export async function POST(req: Request) {
  const { symptoms, age, gender, duration, medicalHistory } = await req.json();

  const userMessage = `
Patient details:
- Age: ${age}
- Gender: ${gender}  
- Symptoms: ${symptoms}
- Duration: ${duration}
- Relevant history: ${medicalHistory || 'None provided'}

Please assess these symptoms and return a DiagnosisResponse JSON object.
  `;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: DIAGNOSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });

  // Parse Claude's JSON response
  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  
  const diagnosis = JSON.parse(content.text);
  
  // Enrich with NHS API data for each condition
  // (fetch condition details to add NHS links and validated descriptions)
  
  return Response.json(diagnosis);
}
```

---

## TypeScript Types

```typescript
// types/index.ts

export type TriageLevel = 
  | 'SELF_CARE'      // Handle at home
  | 'GP_ROUTINE'     // Book a GP appointment  
  | 'GP_URGENT'      // Same-day GP / urgent care
  | '111'            // Call NHS 111
  | '999';           // Emergency — call 999 immediately

export interface SymptomInput {
  symptoms: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  duration: string;
  medicalHistory?: string;
}

export interface PossibleCondition {
  name: string;
  nhsUrl: string;           // https://www.nhs.uk/conditions/{slug}
  likelihood: 'high' | 'medium' | 'low';
  explanation: string;      // Why this fits the symptoms
  keyFeatures: string[];    // Distinguishing characteristics
  triage: TriageLevel;
  redFlags: string[];       // Symptoms that would escalate urgency
}

export interface DiagnosisResponse {
  conditions: PossibleCondition[];
  overallTriage: TriageLevel;   // Most urgent of all conditions
  redFlagsDetected: boolean;
  disclaimer: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## The Disclaimer Component (Non-Negotiable)

This must appear on every page. Medical disclaimer is your primary legal protection.

```tsx
// components/DisclaimerBanner.tsx
export function DisclaimerBanner() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <p className="text-sm text-blue-800">
        <strong>Important:</strong> This tool provides health information only — 
        it does not provide a medical diagnosis. Information is based on NHS 
        guidelines and is intended to help you decide whether and how quickly 
        to seek professional medical advice. Always consult a qualified healthcare 
        professional for diagnosis and treatment. In an emergency, call{' '}
        <strong>999</strong>. For urgent medical advice, call{' '}
        <strong>NHS 111</strong>.
      </p>
    </div>
  );
}
```

---

## Environment Variables

```bash
# .env.local (add to .gitignore immediately)

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# NHS API (free — register at developer.api.nhs.uk)
NHS_API_KEY=your-nhs-api-key

# Optional: Analytics (PostHog is free tier)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

---

## Build Order (Suggested Cursor Workflow)

Build in this sequence — each step is demonstrable and testable:

### Step 1 — Scaffold & NHS API connection (Day 1)
```
1. npx create-next-app@latest nhs-symptom-checker --typescript --tailwind
2. npm install @anthropic-ai/sdk
3. Build lib/nhs-api.ts and test: fetch a condition from the NHS API
4. Build a simple /api/nhs-conditions/route.ts proxy
5. Confirm you can retrieve "asthma", "diabetes" etc. from NHS API
```

### Step 2 — Symptom input UI (Day 1–2)
```
1. Build SymptomInput.tsx — free text field + age/gender dropdowns
2. Add a curated list of common symptom chips (headache, fever, cough, etc.)
   as quick-select options
3. Wire up form submission to /api/diagnose
```

### Step 3 — Diagnosis API route (Day 2)
```
1. Build the Claude integration in /api/diagnose/route.ts
2. Test with hardcoded inputs first, then wire to the form
3. Enrich results by calling NHS API for each returned condition
4. Return structured DiagnosisResponse JSON
```

### Step 4 — Results page (Day 2–3)
```
1. Build ConditionCard.tsx — condition name, explanation, NHS link
2. Build TriageBadge.tsx with colour coding:
   SELF_CARE=green, GP_ROUTINE=blue, GP_URGENT=orange, 111=amber, 999=red
3. Show triage hierarchy clearly — most urgent action prominent at top
4. Add "Ask a question about this condition" CTA per card
```

### Step 5 — Conversational Q&A (Day 3–4)
```
1. Build ChatWindow.tsx with message history state
2. Build /api/chat/route.ts — takes condition context + conversation history
3. Pass the DiagnosisResponse as context in the system prompt
4. Stream responses using Claude's streaming API for better UX
```

### Step 6 — Polish & safety (Day 4–5)
```
1. Add DisclaimerBanner to all pages
2. Implement red-flag detection — 999 results must be visually unmissable
3. Add loading states, error boundaries
4. Basic rate limiting on API routes (upstash/ratelimit is free tier)
5. Deploy to Vercel: vercel deploy
```

---

## Red Flag Conditions (Hardcode These — Don't Leave to AI)

Always escalate to 999 immediately, regardless of AI output:

```typescript
// lib/triage.ts
export const RED_FLAG_SYMPTOMS = [
  // Cardiac
  'chest pain', 'chest tightness', 'pain radiating to arm', 'pain radiating to jaw',
  // Neurological  
  'sudden severe headache', 'worst headache of my life', 'thunderclap headache',
  'face drooping', 'arm weakness', 'slurred speech', 'sudden confusion',
  // Respiratory
  'cannot breathe', 'difficulty breathing', 'lips turning blue',
  // Anaphylaxis
  'throat swelling', 'tongue swelling', 'severe allergic reaction',
  // Sepsis
  'mottled skin', 'rash that does not fade', 'glass test',
  // Self-harm
  'taken too many tablets', 'overdose'
];

export function detectRedFlags(symptoms: string): boolean {
  const lower = symptoms.toLowerCase();
  return RED_FLAG_SYMPTOMS.some(flag => lower.includes(flag));
}
```

---

## Cursor-Specific Tips

- **Use Cursor's Composer** for generating the boilerplate API routes — paste in the TypeScript types and ask it to generate the route
- **Ask Cursor to generate test cases** for the triage logic — this is safety-critical code
- **Use `.cursorrules`** at the root to give Cursor context about the NHS API structure and your TypeScript types:

```
# .cursorrules
This is a UK NHS-aligned health information tool.
Always use UK English (paracetamol not acetaminophen, GP not physician, A&E not ER).
Medical content must always include appropriate disclaimers.
The DiagnosisResponse and SymptomInput types in types/index.ts are the source of truth.
API routes always return structured JSON matching these types.
Never hardcode API keys — always use process.env.
Triage levels: SELF_CARE < GP_ROUTINE < GP_URGENT < 111 < 999 (ascending urgency).
```

---

## Key Research & Reference Links

### NHS APIs & Data
- NHS Developer Portal: https://developer.api.nhs.uk
- NHS Conditions API reference: https://developer.api.nhs.uk/nhs-api/documentation/nhs-website-content
- NHSBSA Open Data Portal: https://opendata.nhsbsa.net
- NHS England Open Data: https://digital.nhs.uk/data-and-information/statistical-publications-open-data-and-data-products
- NHS England Data Catalogue: https://data.england.nhs.uk/dataset

### Clinical Knowledge Bases (Free)
- NICE Clinical Knowledge Summaries (GP-level): https://cks.nice.org.uk
- NICE Conditions A-Z: https://www.nice.org.uk/guidance/conditions-and-diseases
- BNF (drug/treatment info): https://bnf.nice.org.uk
- Human Phenotype Ontology (symptoms → conditions mapping): https://hpo.jax.org
- OpenPrescribing API: https://openprescribing.net/api/

### Clinical Guidelines
- NHS 111 online (pathways reference): https://111.nhs.uk
- NHS Pathways (triage system docs): https://digital.nhs.uk/services/nhs-pathways
- NICE Evidence Standards for Digital Health: https://www.nice.org.uk/about/what-we-do/our-programmes/evidence-standards-framework-for-digital-health-technologies

### Regulatory
- MHRA AI & Medical Devices guidance: https://www.gov.uk/guidance/medical-device-stand-alone-software-including-apps-appsandmobiledevices
- AI & Digital Regulations Service (MHRA/NICE/CQC joint): https://www.digitalregulations.innovation.nhs.uk
- MHRA pre-submission meeting request: https://www.gov.uk/guidance/pre-submission-meetings-with-mhra
- NHS Digital Technology Assessment Criteria (DTAC): https://digital.nhs.uk/about-nhs-digital/corporate-information-and-documents/digital-technology-assessment-criteria-dtac

### Competitive Reference
- Ada Health (B2B model): https://ada.com
- Isabel Symptom Checker: https://symptomchecker.isabelhealthcare.com
- Babylon Health (NHS partnership precedent): https://www.babylonhealth.com
- DxGPT (GPT-4 clinical tool): https://dxgpt.app

### Academic / Market Research
- npj Digital Medicine — Symptom checker accuracy 2025: https://www.nature.com/articles/s41746-025-01566-6
- Frontiers in AI — ML symptom checkers: https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2024.1397388/full
- McKinsey on NHS FDP potential: https://www.mckinsey.com/uk/our-insights/uk-insights/unleashing-the-potential-of-the-nhs-federated-data-platform

---

## What This MVP Proves

By the end of this build you'll have demonstrated:

1. **Technical feasibility** — Claude + NHS API can produce coherent, grounded, triage-aware clinical suggestions
2. **Product concept** — A working UI that real users can interact with and give feedback on
3. **Data pipeline** — A pattern for ingesting and using NHS public data that can be extended to richer sources
4. **Safety architecture** — Red-flag detection, appropriate disclaimers, triage escalation
5. **The gap** — Where the tool falls short without patient-level training data (this becomes your pitch for Phase 2)

**What it doesn't prove yet:** that a model fine-tuned on NHS patient records would outperform a well-prompted general model. That's the Phase 2 research question — and this MVP is the vehicle for gathering the evidence to answer it.

---

## Estimated Build Time

| Phase | Task | Time |
|---|---|---|
| 1 | Scaffold + NHS API | 2–4 hrs |
| 2 | Symptom input UI | 3–4 hrs |
| 3 | Diagnosis API | 3–5 hrs |
| 4 | Results page | 3–4 hrs |
| 5 | Chat interface | 4–6 hrs |
| 6 | Polish + deploy | 2–3 hrs |
| **Total** | | **~17–26 hrs** |

A focused weekend build is realistic. Cursor will accelerate the boilerplate significantly — the real time investment is in the prompts, the triage logic, and making the clinical output feel trustworthy.

---

*Document version: April 2026 | Sources verified at time of writing*
*Data sources and API availability subject to change — verify endpoints before building*
