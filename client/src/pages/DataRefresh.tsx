import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

const DataRefreshPanel = lazy(() => import("@/components/DataRefreshPanel"));

export default function DataRefresh() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Data Refresh</h1>
          <p className="text-muted-foreground mt-1">
            Manually trigger data updates for each category
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access required</CardTitle>
            <CardDescription>
              Only administrators can use the Data Refresh Control Panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <span className="text-sm text-primary hover:underline">Back to Dashboard</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Data Refresh</h1>
        <p className="text-muted-foreground mt-1">
          Manually trigger data updates for each category
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DataRefreshPanel />
      </Suspense>
    </div>
  );
}
