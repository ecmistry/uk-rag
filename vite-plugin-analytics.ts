/**
 * Vite plugin to conditionally inject analytics script
 * Only injects if VITE_ANALYTICS_ENDPOINT is configured
 */

import type { Plugin } from "vite";

export function vitePluginAnalytics(): Plugin {
  return {
    name: "analytics-injector",
    transformIndexHtml(html) {
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;

      // Only inject analytics if both are configured
      if (!analyticsEndpoint || !analyticsWebsiteId) {
        // Remove any analytics script tags with placeholders
        return html.replace(
          /<script[^>]*%VITE_ANALYTICS[^>]*><\/script>/gi,
          ""
        );
      }

      // Replace placeholders with actual values
      return html
        .replace(/%VITE_ANALYTICS_ENDPOINT%/g, analyticsEndpoint)
        .replace(/%VITE_ANALYTICS_WEBSITE_ID%/g, analyticsWebsiteId);
    },
  };
}
