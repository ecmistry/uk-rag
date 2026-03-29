import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import { useHidePreviewBanner } from "./hooks/useHidePreviewBanner";

const MetricDetail = lazy(() => import("./pages/MetricDetail"));
const Charts = lazy(() => import("./pages/Charts"));
const Admin = lazy(() => import("./pages/Admin"));

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/metric/:metricKey"} component={MetricDetail} />
          <Route path={"/charts"} component={Charts} />
          <Route path={"/admin"} component={Admin} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  useHidePreviewBanner();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
