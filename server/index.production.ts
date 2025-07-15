import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";

// Simple log function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = createServer(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'wahrify-frontend' 
    });
  });

  // In production, we can still optionally proxy if needed, but primarily use direct backend calls
  const WORKING_BACKEND_URL = process.env.WORKING_BACKEND_URL || 'http://backend:8001';
  
  // Only set up proxy in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_PROXY === 'true') {
    console.log(`🚀 Proxying /v1 requests to working backend: ${WORKING_BACKEND_URL}`);
    
    app.use('/v1', createProxyMiddleware({
      target: WORKING_BACKEND_URL,
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/v1': '/v1',  // Keep /v1 prefix since backend expects it
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🌐 PROXY: ${req.method} ${req.originalUrl} → ${WORKING_BACKEND_URL}${proxyReq.path}`);
        log(`Proxying ${req.method} ${req.originalUrl} to ${WORKING_BACKEND_URL}${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📥 PROXY RESPONSE: ${proxyRes.statusCode} for ${req.originalUrl}`);
      },
      onError: (err, req, res) => {
        console.log(`❌ PROXY ERROR: ${err.message}`);
        log(`Proxy error: ${err.message}`);
        res.status(502).json({ error: 'Working backend unavailable' });
      }
    }));
  } else {
    console.log(`🔗 Frontend configured for direct backend calls to: ${WORKING_BACKEND_URL}`);
  }

  // Register API routes (for /api/* endpoints only, /v1/* goes to proxy or direct calls)
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files in production
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 3000 for development.
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();