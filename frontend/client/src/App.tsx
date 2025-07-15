import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Auth0TokenProvider } from "@/components/auth/Auth0TokenProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import FactChecker from "@/pages/fact-checker";
import LoginPage from "@/pages/login";
import FeedbackHistoryPage from "@/pages/feedback-history";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/auth-callback";

function Router() {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      
      {/* Auth0 callback route */}
      <Route path="/callback" component={AuthCallback} />
      
      {/* Protected routes - require authentication */}
      <Route path="/">
        <ProtectedRoute>
          <FactChecker />
        </ProtectedRoute>
      </Route>
      <Route path="/feedback-history">
        <ProtectedRoute>
          <FeedbackHistoryPage />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback routes */}
      <Route path="/404" component={NotFound} />
      <Route>
        {/* Redirect unknown routes based on auth status */}
        {isLoading ? null : isAuthenticated ? <Redirect to="/" /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: import.meta.env.VITE_AUTH0_SCOPE || "openid profile email"
      }}
      useRefreshTokens={import.meta.env.VITE_AUTH0_USE_REFRESH_TOKENS === 'true'}
      cacheLocation={import.meta.env.VITE_AUTH0_CACHE_LOCATION as any || 'localstorage'}
    >
      <Auth0TokenProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Auth0TokenProvider>
    </Auth0Provider>
  );
}

export default App;
