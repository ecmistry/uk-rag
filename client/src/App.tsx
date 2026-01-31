import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import MetricDetail from "./pages/MetricDetail";
import Commentary from "./pages/Commentary";
import Documentation from "./pages/Documentation";
import ApiDocs from "./pages/ApiDocs";
import DataRefresh from "./pages/DataRefresh";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/metric/:metricKey"} component={MetricDetail} />
        <Route path={"/commentary"} component={Commentary} />
        <Route path={"/commentary/:id"} component={Commentary} />
        <Route path={"/documentation"} component={Documentation} />
        <Route path={"/api-docs"} component={ApiDocs} />
        <Route path={"/data-refresh"} component={DataRefresh} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
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
