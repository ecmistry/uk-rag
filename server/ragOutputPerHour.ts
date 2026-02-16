/**
 * RAG thresholds for Output per Hour (labour productivity, % change per annum).
 * Red: <= 0.5%
 * Amber: 0.5% < value <= 1.5%
 * Green: > 1.5%
 */
export const OUTPUT_PER_HOUR_RAG = {
  redMax: 0.5,
  amberMax: 1.5,
} as const;

export function getOutputPerHourRagStatus(value: number): "red" | "amber" | "green" {
  if (value > OUTPUT_PER_HOUR_RAG.amberMax) return "green";
  if (value > OUTPUT_PER_HOUR_RAG.redMax) return "amber";
  return "red";
}
