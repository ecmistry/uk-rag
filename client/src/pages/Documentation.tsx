import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BookOpen, Database, Map, List, TrendingUp } from "lucide-react";

export default function Documentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-1">
          UK RAG Portal – overview, architecture, and user guide
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">User Guide</span>
          </TabsTrigger>
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Architecture</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Data Sources</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>UK RAG Dashboard – Real-time monitoring of UK performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                The UK RAG Portal provides Red-Amber-Green (RAG) status monitoring for key UK metrics across Economy, Employment, Education, Crime, Healthcare, and Defence.
              </p>
              <p>
                Metrics are refreshed from official sources (ONS, DfE, Resolution Foundation, NHS, etc.) and displayed with historical trends and commentary.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Roadmap</CardTitle>
              <CardDescription>Planned features and improvements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>See the main dashboard and metric detail pages for current capabilities. Roadmap details can be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Guide</CardTitle>
              <CardDescription>How to use the UK RAG Dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Navigate from the home page to metric categories. Click any metric card to view details and historical trends.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Architecture</CardTitle>
              <CardDescription>Stack and design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>React frontend, tRPC API, MongoDB for persistence. Data is ingested from Python fetchers and CSV/Excel sources.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Catalog</CardTitle>
              <CardDescription>Categories and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Economy: Output per Hour, Real GDP Growth, CPI Inflation, Public Sector Net Debt, Business Investment. Employment: Employment Rate (16+), Employment Rate (16-64). Plus Education, Crime, Healthcare, Defence.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>Official sources used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>ONS, DfE, Resolution Foundation, NHS, GOV.UK statistics. Data is updated via scheduled pulls and admin refresh.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
