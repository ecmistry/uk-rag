import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Code, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ApiDocs() {
  const { data: apiDocs, isLoading } = trpc.metrics.apiDocs.useQuery();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading API documentation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!apiDocs) {
    return (
      <div className="w-full">
        <div className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">API documentation not available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">API Documentation</h1>
          <p className="text-muted-foreground text-lg">
            Developer guide for the UK RAG Dashboard API
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Version</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg px-3 py-1">
              v{apiDocs.version}
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(apiDocs.endpoints).map(([endpoint, details]: [string, any]) => (
            <Card key={endpoint}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-mono">{endpoint}</CardTitle>
                    <CardDescription className="mt-2">{details.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{details.method}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {details.parameters && (
                  <div>
                    <h4 className="font-semibold mb-2">Parameters</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      {Object.entries(details.parameters).map(([key, value]: [string, any]) => (
                        <li key={key}>
                          <code className="bg-muted px-1 rounded">{key}</code>: {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {details.example && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Example Request</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(details.example, endpoint)}
                      >
                        {copiedEndpoint === endpoint ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">{details.example}</code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              All API endpoints are prefixed with:
            </p>
            <code className="bg-muted p-2 rounded block">
              {window.location.origin}/api/trpc
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
