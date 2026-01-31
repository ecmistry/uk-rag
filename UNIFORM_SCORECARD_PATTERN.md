# Uniform Scorecard Pattern for Dashboards

Use this pattern so scorecards look consistent across dashboards (e.g. [RAG - New/Upsell](/sales/rag-new-upsell), [RAG - Cascade](/sales/rag-cascade)).

## Rules

1. **No icons on scorecards** – Do not show CheckCircle2, AlertTriangle, Users, Target, or any other icon on the scorecard itself. RAG colour (card background/border and value colour) is enough for RAG cards; plain cards need no icon.

2. **Center-align all text** – Title, main value, and any subtext (e.g. "Score ≥ 90%" or "Deals: 23") must be center-aligned. Do **not** use `flex flex-row items-center justify-between` on CardHeader (that left-aligns the title and pushes an icon to the right).

3. **Uniform text sizes**
   - **Title:** `text-xs font-medium` (and `text-muted-foreground` if not RAG-coloured). Add `text-center`.
   - **Main value:** `text-lg font-bold` (not `text-xl`, `text-2xl`, or `text-3xl`).
   - **Subtext (condition / count):** `text-xs text-muted-foreground mt-1`. Add `text-center` on the parent.

4. **Layout classes**
   - **CardHeader:** `className="pb-1 pt-2 px-2 text-center"` (compact; no flex/justify-between so the title can centre).
   - **CardTitle:** include `text-center`.
   - **CardContent:** `className="p-2 pt-0 text-center"`.

5. **All KPI/scorecard-style cards** – Use this pattern for every small metric card (RAG percentage cards, count cards, target cards). If you add inline `<Card>` blocks instead of the shared `RAGScorecard` component, they must still follow the same layout and classes (e.g. [RAG - SQL Quantity](client/src/pages/marketing/RAGSqlQuantity.tsx) top row: Current RAG uses `RAGScorecard`; Record Count, EMESA/NORAM/Other, Total SQL Target use inline Cards with this pattern).

## Example (inline scorecard, no icon)

```tsx
<Card className={/* RAG bg/border if needed */}>
  <CardHeader className="pb-1 pt-2 px-2 text-center">
    <CardTitle className="text-xs font-medium text-muted-foreground text-center">
      Your Metric Label
    </CardTitle>
  </CardHeader>
  <CardContent className="p-2 pt-0 text-center">
    <div className="text-lg font-bold">{formatCurrency(value)}</div>
    <p className="text-xs text-muted-foreground mt-1">
      Deals: {count}
    </p>
  </CardContent>
</Card>
```

## Example (RAG-coloured scorecard, no icon)

```tsx
<Card className={cn(
  isGreen && 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800',
  isAmber && 'bg-amber-50 border-amber-300 ...',
  isRed && 'bg-red-50 border-red-300 ...'
)}>
  <CardHeader className="pb-1 pt-2 px-2 text-center">
    <CardTitle className="text-xs font-medium text-center">Weighted RAG</CardTitle>
  </CardHeader>
  <CardContent className="p-2 pt-0 text-center">
    <div className={cn('text-lg font-bold', isGreen && 'text-green-600 ...', /* etc */)}>
      {formatPercent(value)}%
    </div>
    <p className="text-xs text-muted-foreground mt-1">Score ≥ 90%</p>
  </CardContent>
</Card>
```

## Reference dashboards

- **RAG - New/Upsell** (`client/src/pages/sales/RAGNewUpsell.tsx`) – Score Cards section.
- **RAG - Cascade** (`client/src/pages/sales/RAGCascade.tsx`) – KPI Tiles section.
- **RAG - SQL Quantity** (`client/src/pages/marketing/RAGSqlQuantity.tsx`) – Top row: Current RAG uses `RAGScorecard`; Record Count, EMESA/NORAM/Other, Total SQL Target use inline Cards with the pattern above (no icons, center-aligned, text-xs title / text-lg value).

Apply the same pattern when adding or updating scorecards on other dashboards so the portal stays visually consistent.

## Phased rollout

For a stage-by-stage rollout across the whole portal, see **[Uniform Scorecard Phased Plan](./UNIFORM_SCORECARD_PHASED_PLAN.md)**. It lists what’s already done and phases (Foundation → Marketing → Support → Sales/SE → Customer Success/Operations → Product/PE) so you can review each section as it’s completed.
