import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Auth0 token getter - to be called from components with Auth0 hook
let getAuth0Token: (() => Promise<string | undefined>) | null = null;

export function setAuth0TokenGetter(tokenGetter: () => Promise<string | undefined>) {
  getAuth0Token = tokenGetter;
}

// Helper function to get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (getAuth0Token) {
      const token = await getAuth0Token();
      if (token) {
        console.log('🔐 QueryClient: Adding Authorization header', {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token?.substring(0, 20) + '...'
        });
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
    }
    console.log('🔐 QueryClient: No token available, sending request without auth');
    return {
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('🔐 QueryClient: Error getting auth token:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

// Dynamic backend URL based on environment
const getBackendUrl = () => {
  // In browser, check if we're running in Docker or development
  if (typeof window !== 'undefined') {
    // Check for Vite environment variable first (production)
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    // Check if we're in a Docker environment or production
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development environment - direct to localhost backend
      return 'http://localhost:8001';
    } else {
      // Production or Docker environment - use service name or same host
      return `${window.location.protocol}//${hostname}:8001`;
    }
  }
  // Server-side fallback
  return process.env.BACKEND_URL || 'http://backend:8001';
};

// Detect if we're running on static hosting (Firebase) without Express server
const isStaticHosting = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Firebase hosting domains or any domain that's not localhost/development
  return hostname.includes('firebaseapp.com') || 
         hostname.includes('web.app') || 
         (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.'));
};

// Authenticated requests to backend via Express proxy or direct calls
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let apiUrl = url;
  
  // Get auth headers
  const authHeaders = await getAuthHeaders();
  
  // Check if we should make direct backend calls (Firebase hosting)
  if (isStaticHosting() && (url.startsWith("/v1") || !url.startsWith("/api"))) {
    // Direct backend call for static hosting
    const backendUrl = getBackendUrl();
    if (url.startsWith("/v1")) {
      apiUrl = `${backendUrl}${url}`;
    } else {
      apiUrl = `${backendUrl}/v1${url}`;
    }
    
    console.log('🌐 API Request:', {
      method,
      url: apiUrl,
      headers: authHeaders,
      hasData: !!data,
      isStaticHosting: true
    });
    
    const res = await fetch(apiUrl, {
      method,
      headers: authHeaders,
      body: data ? JSON.stringify(data) : undefined,
      mode: 'cors',
    });

    console.log('🌐 API Response:', {
      status: res.status,
      statusText: res.statusText,
      url: apiUrl,
      ok: res.ok
    });

    await throwIfResNotOk(res);
    return res;
  } else {
    // Use authenticated proxy for Express server environments
    if (url.startsWith("/v1")) {
      // Use authenticated proxy for backend requests
      apiUrl = `/api/backend${url}`;
    } else if (!url.startsWith("/api")) {
      // Default to /v1 backend endpoint via proxy
      apiUrl = `/api/backend/v1${url}`;
    }
    // /api endpoints remain relative (handled by Express server)
    
    const res = await fetch(apiUrl, {
      method,
      headers: authHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle Veracity backend endpoints (/v1/*) and Express endpoints (/api/*)
    const url = queryKey.join("/") as string;
    let apiUrl = url;
    
    // Get auth headers
    const authHeaders = await getAuthHeaders();
    
    // Check if we should make direct backend calls (Firebase hosting)
    if (isStaticHosting() && (url.startsWith("/v1") || !url.startsWith("/api"))) {
      // Direct backend call for static hosting
      const backendUrl = getBackendUrl();
      if (url.startsWith("/v1")) {
        apiUrl = `${backendUrl}${url}`;
      } else {
        apiUrl = `${backendUrl}/v1${url}`;
      }
      
      const res = await fetch(apiUrl, {
        headers: authHeaders,
        mode: 'cors',
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } else {
      // Use authenticated proxy for Express server environments
      if (url.startsWith("/v1")) {
        // Use authenticated proxy for backend requests
        apiUrl = `/api/backend${url}`;
      } else if (!url.startsWith("/api")) {
        // Default to /v1 backend endpoint via proxy
        apiUrl = `/api/backend/v1${url}`;
      }
      // /api endpoints remain relative (handled by Express server)
      
      const res = await fetch(apiUrl, {
        headers: authHeaders,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
