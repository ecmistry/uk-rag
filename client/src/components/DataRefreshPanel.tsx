import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Minimal placeholder implementation so the app can build.
 * The real data refresh logic still happens via the server / API.
 */
export default function DataRefreshPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Refresh Control Panel</CardTitle>
        <CardDescription>
          This placeholder component allows the application to compile. Use the
          existing CLI/scripts to refresh data until a richer UI is implemented.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          Admins can continue to run the Python fetchers and TypeScript loaders
          (for example, the economy fetcher and loader) to refresh data for the
          dashboard. This panel can later be extended to call those APIs
          directly.
        </p>
      </CardContent>
    </Card>
  );
}

