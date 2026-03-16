import { getTrendSentiment } from "@/data/metricDirections";

interface TrendIndicatorProps {
  metricKey: string;
  currentValue: number;
  previousValue: number | null;
}

/**
 * Small trend arrow with a mini wavy line, coloured by whether the
 * change is positive (green), negative (red), or neutral (grey).
 */
export default function TrendIndicator({
  metricKey,
  currentValue,
  previousValue,
}: TrendIndicatorProps) {
  if (previousValue === null || previousValue === undefined) {
    return (
      <svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Single data point — no trend yet"
        className="inline-block"
      >
        <circle cx="6" cy="8" r="3" fill="#9ca3af" />
      </svg>
    );
  }

  const sentiment = getTrendSentiment(metricKey, currentValue, previousValue);
  const went = currentValue > previousValue ? "up" : currentValue < previousValue ? "down" : "flat";

  const color =
    sentiment === "positive"
      ? "#16a34a"
      : sentiment === "negative"
        ? "#dc2626"
        : "#9ca3af";

  return (
    <svg
      width="28"
      height="16"
      viewBox="0 0 28 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Trend: ${went}, ${sentiment}`}
      className="inline-block"
    >
      {went === "up" && (
        <>
          <path
            d="M2 13 C6 12, 8 10, 12 9 C16 8, 18 5, 22 3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 2 L22 3 L21 7"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {went === "down" && (
        <>
          <path
            d="M2 3 C6 4, 8 6, 12 7 C16 8, 18 11, 22 13"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 14 L22 13 L21 9"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {went === "flat" && (
        <>
          <path
            d="M2 8 C7 7, 10 9, 14 8 C18 7, 21 9, 26 8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
