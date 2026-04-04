import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  Loader2,
  Send,
  Stethoscope,
  Phone,
  ExternalLink,
  ShieldAlert,
  Heart,
  MessageCircle,
  User,
  Bot,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TriageLevel = "SELF_CARE" | "GP_ROUTINE" | "GP_URGENT" | "111" | "999";

interface PossibleCondition {
  name: string;
  nhsUrl: string;
  likelihood: "high" | "medium" | "low";
  explanation: string;
  keyFeatures: string[];
  triage: TriageLevel;
  redFlags: string[];
  nhsContent?: string;
}

interface DiagnosisResponse {
  conditions: PossibleCondition[];
  overallTriage: TriageLevel;
  redFlagsDetected: boolean;
  disclaimer: string;
  generatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIAGE_CONFIG: Record<
  TriageLevel,
  { label: string; color: string; bg: string; description: string }
> = {
  SELF_CARE: {
    label: "Self-care",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    description: "You can manage this at home",
  },
  GP_ROUTINE: {
    label: "GP (routine)",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    description: "Book a GP appointment",
  },
  GP_URGENT: {
    label: "GP (urgent)",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    description: "Request a same-day GP appointment",
  },
  "111": {
    label: "Call NHS 111",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    description: "Call 111 for urgent medical advice",
  },
  "999": {
    label: "Call 999",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    description: "Call 999 or go to A&E immediately",
  },
};

const LIKELIHOOD_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  high: {
    label: "Most likely",
    className:
      "bg-primary/10 text-primary border-primary/20",
  },
  medium: {
    label: "Possible",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  low: {
    label: "Less likely",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
};

const SYMPTOM_CHIPS = [
  "Headache",
  "Fever",
  "Cough",
  "Sore throat",
  "Fatigue",
  "Nausea",
  "Dizziness",
  "Back pain",
  "Joint pain",
  "Shortness of breath",
  "Chest pain",
  "Abdominal pain",
  "Rash",
  "Muscle ache",
];

// ─── Disclaimer ──────────────────────────────────────────────────────────────

function DisclaimerBanner() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
      <div className="flex gap-3">
        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Important:</strong> This tool provides health information only
          — it does not provide a medical diagnosis. Information is based on NHS
          guidelines and is intended to help you decide whether and how quickly
          to seek professional medical advice. Always consult a qualified
          healthcare professional for diagnosis and treatment. In an emergency,
          call <strong>999</strong>. For urgent medical advice, call{" "}
          <strong>NHS 111</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Emergency Banner ────────────────────────────────────────────────────────

function EmergencyBanner() {
  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 p-6 text-center space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-center gap-2">
        <Phone className="h-6 w-6 text-red-600" />
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
          Call 999 Now
        </h2>
      </div>
      <p className="text-red-700 dark:text-red-300 font-medium">
        Red-flag symptoms have been detected. Please call 999 immediately or go
        to your nearest A&E.
      </p>
      <p className="text-sm text-red-600 dark:text-red-400">
        Do not wait — these symptoms may require emergency treatment.
      </p>
    </div>
  );
}

// ─── Triage Badge ────────────────────────────────────────────────────────────

function TriageBadge({ level }: { level: TriageLevel }) {
  const config = TRIAGE_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}
    >
      {level === "999" && <Phone className="h-3 w-3" />}
      {level === "111" && <Phone className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

// ─── Condition Card ──────────────────────────────────────────────────────────

function ConditionCard({
  condition,
  onAskQuestion,
}: {
  condition: PossibleCondition;
  onAskQuestion: (conditionName: string) => void;
}) {
  const likelihood = LIKELIHOOD_CONFIG[condition.likelihood] ?? LIKELIHOOD_CONFIG.low;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{condition.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={likelihood.className}
              >
                {likelihood.label}
              </Badge>
              <TriageBadge level={condition.triage} />
            </div>
          </div>
          {condition.nhsUrl && (
            <a
              href={condition.nhsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{condition.explanation}</p>

        {condition.keyFeatures?.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5">Key features:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {condition.keyFeatures.map((f, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {condition.nhsContent && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-2.5">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              From NHS.uk:
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {condition.nhsContent}
            </p>
          </div>
        )}

        {condition.redFlags?.length > 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-2.5">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Seek urgent help if:
            </p>
            <ul className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-0.5">
              {condition.redFlags.map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {TRIAGE_CONFIG[condition.triage]?.description}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onAskQuestion(condition.name)}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Ask about this
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chat Interface ──────────────────────────────────────────────────────────

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function ChatWindow({
  conditionContext,
  initialQuestion,
}: {
  conditionContext?: string;
  initialQuestion?: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMutation = trpc.diagnosis.chat.useMutation();
  const hasSentInitial = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || chatMutation.isPending) return;

      const userMsg: ChatMsg = { role: "user", content: text.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");

      try {
        const result = await chatMutation.mutateAsync({
          messages: updated.map((m) => ({ ...m, role: m.role as "user" | "assistant" | "system" })),
          conditionContext,
        });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I was unable to process your question. Please try again or contact NHS 111 for medical advice.",
          },
        ]);
      }
    },
    [messages, chatMutation, conditionContext],
  );

  useEffect(() => {
    if (initialQuestion && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialQuestion);
    }
  }, [initialQuestion, sendMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Health Q&A
        </CardTitle>
        <CardDescription>
          Ask follow-up questions about your results. This is not a substitute
          for professional medical advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto rounded-md border p-3 space-y-3 bg-muted/30"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Ask a question about your results...
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-background border rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Symptom Input Form ──────────────────────────────────────────────────────

function SymptomForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: {
    symptoms: string;
    age: number;
    gender: string;
    duration: string;
    medicalHistory: string;
  }) => void;
  isPending: boolean;
}) {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  const handleChipClick = (chip: string) => {
    const lower = symptoms.toLowerCase();
    if (lower.includes(chip.toLowerCase())) return;
    setSymptoms((prev) => (prev ? `${prev}, ${chip.toLowerCase()}` : chip.toLowerCase()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !age || !gender || !duration) return;
    onSubmit({
      symptoms,
      age: parseInt(age, 10),
      gender,
      duration,
      medicalHistory,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Symptom Assessment
        </CardTitle>
        <CardDescription>
          Describe your symptoms below. The more detail you provide, the more
          helpful the assessment will be.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="symptoms">
              What symptoms are you experiencing?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I've had a persistent headache for 3 days, feel tired, and have a mild fever..."
              rows={3}
              required
              disabled={isPending}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYMPTOM_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-full text-xs border hover:bg-accent transition-colors disabled:opacity-50"
                  disabled={isPending}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">
                Age <span className="text-destructive">*</span>
              </Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={gender}
                onValueChange={setGender}
                disabled={isPending}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 days"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="history">
              Relevant medical history{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="history"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. asthma, type 2 diabetes, currently taking metformin..."
              rows={2}
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            disabled={
              isPending || !symptoms.trim() || !age || !gender || !duration
            }
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assessing symptoms...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Assess symptoms
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Results View ────────────────────────────────────────────────────────────

function ResultsView({
  result,
  onBack,
  onAskQuestion,
}: {
  result: DiagnosisResponse;
  onBack: () => void;
  onAskQuestion: (conditionName: string) => void;
}) {
  const triageConfig = TRIAGE_CONFIG[result.overallTriage];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        New assessment
      </Button>

      {result.redFlagsDetected && <EmergencyBanner />}

      {!result.redFlagsDetected && (
        <Card
          className={`border-l-4 ${
            result.overallTriage === "999"
              ? "border-l-red-500"
              : result.overallTriage === "111"
                ? "border-l-amber-500"
                : result.overallTriage === "GP_URGENT"
                  ? "border-l-orange-500"
                  : result.overallTriage === "GP_ROUTINE"
                    ? "border-l-blue-500"
                    : "border-l-green-500"
          }`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TriageBadge level={result.overallTriage} />
              <span className="text-sm font-medium">
                {triageConfig?.description}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {result.conditions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Possible conditions
          </h3>
          {result.conditions.map((c, i) => (
            <ConditionCard
              key={i}
              condition={c}
              onAskQuestion={onAskQuestion}
            />
          ))}
        </div>
      )}

      {result.disclaimer && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Diagnosis() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [chatQuestion, setChatQuestion] = useState<string | undefined>();
  const [conditionContext, setConditionContext] = useState<string | undefined>();

  const diagnoseMutation = trpc.diagnosis.assess.useMutation({
    onSuccess: (data) => {
      setResult(data as DiagnosisResponse);
      if (data.conditions?.length > 0) {
        setConditionContext(
          data.conditions
            .map(
              (c: PossibleCondition) =>
                `${c.name} (${c.likelihood} likelihood, triage: ${c.triage}): ${c.explanation}`,
            )
            .join("\n"),
        );
      }
    },
  });

  if (!isAdmin) {
    return (
      <div className="w-full py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            NHS Symptom Assessment
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            This tool is restricted to administrators
          </p>
        </div>
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <p className="text-sm">
                Please sign in as an administrator to access this tool.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (data: {
    symptoms: string;
    age: number;
    gender: string;
    duration: string;
    medicalHistory: string;
  }) => {
    setResult(null);
    setChatQuestion(undefined);
    setConditionContext(undefined);
    diagnoseMutation.mutate({
      symptoms: data.symptoms,
      age: data.age,
      gender: data.gender as "male" | "female" | "other" | "prefer_not_to_say",
      duration: data.duration,
      medicalHistory: data.medicalHistory || undefined,
    });
  };

  const handleAskQuestion = (conditionName: string) => {
    setChatQuestion(
      `Tell me more about ${conditionName}. What should I expect, and when should I see a GP?`,
    );
  };

  const handleBack = () => {
    setResult(null);
    setChatQuestion(undefined);
    setConditionContext(undefined);
    diagnoseMutation.reset();
  };

  return (
    <div className="w-full py-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          NHS Symptom Assessment
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-powered symptom checker grounded in NHS guidelines
        </p>
      </div>

      <DisclaimerBanner />

      {diagnoseMutation.error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Assessment failed
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {diagnoseMutation.error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {!result ? (
        <SymptomForm
          onSubmit={handleSubmit}
          isPending={diagnoseMutation.isPending}
        />
      ) : (
        <>
          <ResultsView
            result={result}
            onBack={handleBack}
            onAskQuestion={handleAskQuestion}
          />
          <ChatWindow
            conditionContext={conditionContext}
            initialQuestion={chatQuestion}
          />
        </>
      )}
    </div>
  );
}
