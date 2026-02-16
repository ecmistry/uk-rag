import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Documentation() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-1">
          High-level notes and links for the UK RAG dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About this dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This page is a lightweight placeholder so the application can build
            successfully. The main product documentation still lives in the
            project&apos;s markdown files (for example in the root{" "}
            <code>docs/</code> directory) and in your own internal notes.
          </p>
          <p>
            You can safely keep using this page as-is, or later replace it with
            richer in-app documentation if you prefer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
