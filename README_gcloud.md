# Wahrify Fact-Checking Backend - Google Cloud Production Deployment

🚀 **Production-ready AI-powered fact-checking system deployed on Google Cloud Platform with ML analysis, real-time source discovery, and LLM-based verification.**

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GOOGLE CLOUD PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Cloud Run     │    │   Cloud SQL     │    │ Secret Manager  │         │
│  │                 │    │                 │    │                 │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │         │
│  │ │ FastAPI App │ │◄──►│ │ PostgreSQL  │ │    │ │ API Keys    │ │         │
│  │ │ - Claims    │ │    │ │ - Users     │ │    │ │ - Google    │ │         │
│  │ │ - Analysis  │ │    │ │ - Claims    │ │    │ │ - OpenRouter│ │         │
│  │ │ - Search    │ │    │ │ - Sources   │ │    │ │ - Database  │ │         │
│  │ └─────────────┘ │    │ │ - Analysis  │ │    │ └─────────────┘ │         │
│  │                 │    │ └─────────────┘ │    │                 │         │
│  │ ┌─────────────┐ │    │                 │    │                 │         │
│  │ │ ML Models   │ │    │                 │    │                 │         │
│  │ │ - Sentence  │ │    │                 │    │                 │         │
│  │ │   Transform │ │    │                 │    │                 │         │
│  │ │ - Embeddings│ │    │                 │    │                 │         │
│  │ └─────────────┘ │    │                 │    │                 │         │
│  │                 │    │                 │    │                 │         │
│  │ Memory: 4GB     │    │ Tier: db-f1     │    │ Encrypted Store │         │
│  │ CPU: 1 vCPU     │    │ Region: EU      │    │ Auto Rotation   │         │
│  │ Timeout: 300s   │    │ Backup: Auto    │    │ IAM Access      │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   INTEGRATIONS   │
                           └─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                          │                           │
┌───────▼────────┐     ┌───────────▼─────────┐     ┌─────────▼────────┐
│ Google Custom  │     │   OpenRouter LLM    │     │ Auth0 (Optional) │
│ Search API     │     │      Service        │     │   Authentication │
│ - Real-time    │     │ - Llama 3.1 70B     │     │ - JWT Tokens     │
│ - Multi-lang   │     │ - GPT-4 Models      │     │ - User Sessions  │
│ - Source URLs  │     │ - Analysis Engine   │     │ - OAuth 2.0      │
│ - Credibility  │     │ - Veracity Scoring  │     │ - RBAC           │
└────────────────┘     └─────────────────────┘     └──────────────────┘
```

## 📁 Project Structure (Google Cloud Deployment)

```
backend-postgresql/
├── 🐳 Dockerfile                           # Production container config
├── 🐳 Dockerfile.cloudrun                  # Cloud Run optimized version
├── 🚀 deploy-cloudrun.sh                   # Automated deployment script
├── 📦 requirements-minimal.txt             # Optimized dependencies for Cloud Run
├── 📦 requirements.txt                      # Full development dependencies
├── ⚙️ .env                                 # Local environment (NOT committed)
├── 📖 README_gcloud.md                     # This comprehensive guide
│
├── 📁 app/                                 # Application source code
│   ├── 🚀 main.py                          # FastAPI app with CORS & middleware
│   │
│   ├── 📁 api/                             # REST API layer
│   │   ├── 🛣️ router.py                    # Main API router configuration
│   │   ├── 🔧 dependencies.py              # Dependency injection & services
│   │   └── 📁 endpoints/                   # API endpoint modules
│   │       ├── 🏥 health_endpoints.py      # System health & diagnostics
│   │       ├── 📝 claim_endpoints.py       # Claims CRUD & analysis
│   │       ├── 👤 user_endpoints.py        # User management
│   │       ├── 🔍 search_endpoints.py      # Search results access
│   │       ├── 📊 analysis_endpoints.py    # Analysis results
│   │       ├── 📄 source_endpoints.py      # Source management
│   │       └── 💬 conversation_endpoints.py # Chat functionality
│   │
│   ├── 📁 core/                            # Core application logic
│   │   ├── ⚙️ config.py                    # Configuration management
│   │   ├── ❌ exceptions.py                # Custom exception classes
│   │   ├── 📁 auth/                        # Authentication & authorization
│   │   │   ├── 🔐 auth0_middleware.py      # Auth0 JWT middleware
│   │   │   └── 👤 user_manager.py          # User session management
│   │   └── 📁 llm/                         # Language model providers
│   │       └── 🤖 openrouter_provider.py   # OpenRouter API integration
│   │
│   ├── 📁 models/                          # Data models
│   │   ├── 📁 database/                    # SQLAlchemy ORM models
│   │   │   └── 🗃️ models.py                # Database schema definitions
│   │   └── 📁 domain/                      # Domain business models
│   │       ├── 📝 claim.py                 # Claim entity
│   │       ├── 👤 user.py                  # User entity
│   │       └── 🔍 search.py                # Search entity
│   │
│   ├── 📁 schemas/                         # API request/response schemas
│   │   ├── 📝 claim_schema.py              # Claim validation schemas
│   │   ├── 📊 analysis_schema.py           # Analysis result schemas
│   │   └── 👤 user_schema.py               # User data schemas
│   │
│   ├── 📁 repositories/                    # Data access layer
│   │   └── 📁 implementations/             # Repository implementations
│   │       ├── 📝 claim_repository.py      # Claims data access
│   │       ├── 👤 user_repository.py       # User data access
│   │       └── 🔍 search_repository.py     # Search data access
│   │
│   ├── 📁 services/                        # Business logic layer
│   │   ├── 📊 analysis_orchestrator.py     # Main analysis coordinator
│   │   ├── 📝 claim_service.py             # Claims business logic
│   │   ├── 👤 user_service.py              # User management logic
│   │   └── 📁 implementations/             # Service implementations
│   │       ├── 🔍 web_search_service.py    # Google Search integration
│   │       └── 🧠 embedding_generator.py   # ML embedding generation
│   │
│   └── 📁 db/                              # Database configuration
│       └── 🔗 session.py                   # Database connection management
│
├── 📁 migrations/                          # Database schema migrations
│   └── 📁 versions/                        # Alembic migration files
│       └── *.py                            # Migration scripts
│
└── 📁 infrastructure/                      # Infrastructure as code (optional)
    └── terraform/                          # Terraform configurations
```

## 🌐 Complete API Reference

### Production Base URL
```
https://wahrify-backend-1010886348729.europe-west1.run.app
```

### 🏥 System Health & Diagnostics
```http
GET  /v1/health                    # Basic system health check
GET  /v1/health/ml                 # ML models status & performance
GET  /v1/health/search             # Google Search API connectivity
```

**Health Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-13T12:40:00Z",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

**ML Health Response:**
```json
{
  "status": "healthy",
  "ml_status": "operational",
  "embedding_dimension": 768,
  "model_name": "all-MiniLM-L6-v2",
  "load_time_ms": 2341
}
```

**Search Health Response:**
```json
{
  "status": "healthy",
  "search_status": "operational",
  "api_key_configured": true,
  "engine_id_configured": true,
  "test_results": 1,
  "response_time_ms": 156
}
```

### 📝 Claims Analysis (Core Feature)
```http
POST /v1/claims/analyze-test       # Public testing endpoint (no auth required)
POST /v1/claims/analyze            # Full analysis with authentication
POST /v1/claims/                   # Create claim without analysis
GET  /v1/claims/                   # List user's claims (paginated)
GET  /v1/claims/{claim_id}         # Get specific claim details
PATCH /v1/claims/{claim_id}/status # Update claim status
POST /v1/claims/batch              # Batch analysis (up to 100 claims)
GET  /v1/claims/batch/results      # Get batch analysis results
```

**Analysis Request:**
```json
{
  "claim_text": "The GBU-57 bombs penetrate 200 feet underground",
  "context": "Military analysis discussion",
  "language": "english"
}
```

**Analysis Response:**
```json
{
  "claim": {
    "id": "uuid-string",
    "user_id": "uuid-string", 
    "claim_text": "The GBU-57 bombs penetrate 200 feet underground",
    "context": "Military analysis discussion",
    "status": "analyzed",
    "language": "english",
    "created_at": "2025-07-13T12:40:33Z",
    "updated_at": "2025-07-13T12:40:42Z"
  },
  "analysis": {
    "id": "analysis-uuid",
    "claim_id": "claim-uuid",
    "veracity_score": 0.8,
    "confidence_score": 0.75,
    "analysis_text": "Based on multiple credible sources including NPR and Scientific American, the GBU-57 bomb's 200-foot penetration capability is documented...",
    "created_at": "2025-07-13T12:40:33Z",
    "sources": [
      {
        "id": "source-uuid",
        "url": "https://en.wikipedia.org/wiki/GBU-57A/B_MOP",
        "title": "GBU-57A/B MOP - Wikipedia",
        "snippet": "The GBU-57 series MOP (Massive Ordnance Penetrator)...",
        "credibility_score": 0.83,
        "domain_name": "wikipedia.org",
        "domain_credibility": 0.85,
        "created_at": "2025-07-13T12:40:35Z"
      }
    ]
  },
  "message": "Analysis completed successfully"
}
```

### 👤 User Management
```http
POST /v1/users/                   # Create new user
GET  /v1/users/me                 # Get current user profile
PUT  /v1/users/me                 # Update user profile
DELETE /v1/users/me               # Delete user account
GET  /v1/users/stats              # User statistics
```

### 🔍 Search & Sources
```http
GET  /v1/searches/{analysis_id}   # Get search results for analysis
POST /v1/sources/                 # Add manual source
GET  /v1/sources/{source_id}      # Get source details
PUT  /v1/sources/{source_id}      # Update source information
```

### 📊 Analysis Results
```http
GET  /v1/analysis/{claim_id}      # Get analysis for specific claim
GET  /v1/analysis/              # List analyses with filters
POST /v1/analysis/{id}/feedback   # Submit feedback on analysis
```

### 💬 Conversations (Optional)
```http
POST /v1/conversations/           # Start new conversation
GET  /v1/conversations/{id}       # Get conversation history
POST /v1/conversations/{id}/messages # Add message to conversation
```

## 🚀 Complete Deployment Guide

### 1. Prerequisites Setup

#### Install Google Cloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init
gcloud auth login
```

#### Set Project Configuration
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com  
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Verify Setup
```bash
gcloud config list
gcloud projects describe YOUR_PROJECT_ID
```

### 2. Database Setup (Cloud SQL)

#### Create PostgreSQL Instance
```bash
# Create Cloud SQL instance
gcloud sql instances create wahrify-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=europe-west1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --deletion-protection

# Create database
gcloud sql databases create mitigation_misinformation_db \
  --instance=wahrify-db

# Create user (replace with strong password)
gcloud sql users create wahrify-user \
  --instance=wahrify-db \
  --password=YOUR_STRONG_PASSWORD
```

#### Configure Database URL Secret
```bash
# Create database URL secret
echo -n "postgresql://wahrify-user:YOUR_PASSWORD@/mitigation_misinformation_db?host=/cloudsql/YOUR_PROJECT:europe-west1:wahrify-db" | \
gcloud secrets create database-url --data-file=-
```

### 3. External API Configuration

#### Google Custom Search API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Custom Search API
3. Create API key in Credentials
4. Create Custom Search Engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com)

```bash
# Store Google Search credentials (replace with your values)
echo -n "YOUR_GOOGLE_API_KEY" | gcloud secrets create google-search-api-key --data-file=-
echo -n "YOUR_SEARCH_ENGINE_ID" | gcloud secrets create google-search-engine-id --data-file=-
```

#### OpenRouter API Setup
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Generate API key
3. Add credits to account

```bash
# Store OpenRouter API key
echo -n "sk-or-v1-YOUR_OPENROUTER_KEY" | gcloud secrets create openrouter-api-key --data-file=-
```

#### Auth0 Setup (Optional)
```bash
# Store Auth0 credentials if using authentication
echo -n "YOUR_AUTH0_DOMAIN" | gcloud secrets create auth0-domain --data-file=-
echo -n "YOUR_AUTH0_CLIENT_SECRET" | gcloud secrets create auth0-client-secret --data-file=-
```

### 4. Deploy to Cloud Run

#### Option A: Automated Deployment Script
```bash
# Make script executable
chmod +x deploy-cloudrun.sh

# Run deployment
./deploy-cloudrun.sh
```

#### Option B: Manual Deployment
```bash
# Deploy with all configurations
gcloud run deploy wahrify-backend \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated \
  --memory=4Gi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --max-instances=10 \
  --set-env-vars="PYTHONPATH=/app" \
  --set-secrets="DATABASE_URL=database-url:latest,GOOGLE_SEARCH_API_KEY=google-search-api-key:latest,GOOGLE_SEARCH_ENGINE_ID=google-search-engine-id:latest,OPENROUTER_API_KEY=openrouter-api-key:latest" \
  --add-cloudsql-instances=YOUR_PROJECT:europe-west1:wahrify-db \
  --labels="app=wahrify,env=production,version=1.0"
```

#### Option C: Pre-built Image Deployment
```bash
# Build and push image
docker build -t gcr.io/YOUR_PROJECT/wahrify-backend .
docker push gcr.io/YOUR_PROJECT/wahrify-backend

# Deploy from image
gcloud run deploy wahrify-backend \
  --image=gcr.io/YOUR_PROJECT/wahrify-backend \
  --region=europe-west1 \
  [... same parameters as above]
```

### 5. Post-Deployment Configuration

#### Run Database Migrations
```bash
# Connect to Cloud Run instance and run migrations
gcloud run services proxy wahrify-backend --port=8080 &
curl -X POST http://localhost:8080/v1/admin/migrate
```

#### Verify Deployment
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe wahrify-backend --region=europe-west1 --format="value(status.url)")
echo "Service deployed at: $SERVICE_URL"

# Test health endpoints
curl $SERVICE_URL/v1/health
curl $SERVICE_URL/v1/health/ml  
curl $SERVICE_URL/v1/health/search
```

## 🧪 Comprehensive Testing Guide

### System Health Verification
```bash
# Set your service URL
export SERVICE_URL="https://wahrify-backend-1010886348729.europe-west1.run.app"

# Test basic health
curl -f $SERVICE_URL/v1/health || echo "Health check failed"

# Test ML models
curl -f $SERVICE_URL/v1/health/ml || echo "ML models not working"

# Test search integration  
curl -f $SERVICE_URL/v1/health/search || echo "Search API not working"
```

### Fact-Checking End-to-End Test
```bash
# Test with a verifiable claim
curl -X POST "$SERVICE_URL/v1/claims/analyze-test" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_text": "Water boils at 100 degrees Celsius at sea level",
    "context": "Basic physics fact",
    "language": "english"
  }' | jq '.'

# Expected: High veracity score with multiple sources
```

### Performance Testing
```bash
# Test concurrent requests
for i in {1..10}; do
  curl -X POST "$SERVICE_URL/v1/claims/analyze-test" \
    -H "Content-Type: application/json" \
    -d "{\"claim_text\": \"Test claim $i\", \"context\": \"\", \"language\": \"english\"}" &
done
wait
```

### Error Handling Tests
```bash
# Test malformed request
curl -X POST "$SERVICE_URL/v1/claims/analyze-test" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}' \
  -w "Status: %{http_code}\n"

# Test rate limiting
for i in {1..100}; do
  curl -f $SERVICE_URL/v1/health || echo "Request $i failed"
done
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Core application settings
PYTHONPATH=/app                               # Python module path
DEBUG=false                                   # Debug mode (production: false)

# Database configuration (from Secret Manager)
DATABASE_URL=postgresql+asyncpg://...         # Async PostgreSQL connection

# External API keys (from Secret Manager)  
GOOGLE_SEARCH_API_KEY=AIza...                # Google Custom Search API
GOOGLE_SEARCH_ENGINE_ID=f5b78...             # Search engine identifier
OPENROUTER_API_KEY=sk-or-v1-...              # OpenRouter LLM API

# Authentication (optional)
AUTH0_DOMAIN=your-domain.auth0.com            # Auth0 domain
AUTH0_AUDIENCE=https://your-api.com           # Auth0 API audience
AUTH0_CLIENT_ID=your-client-id                # Auth0 client ID
AUTH0_CLIENT_SECRET=your-secret               # Auth0 client secret (Secret Manager)

# ML Model configuration
LLAMA_MODEL_NAME=meta/llama-3.3-70b-instruct-maas  # Default LLM model
VERTEX_AI_LOCATION=us-central1                # Vertex AI region
GOOGLE_CLOUD_PROJECT=your-project-id          # GCP project
```

### Secret Manager Configuration
```bash
# List all secrets
gcloud secrets list

# View secret versions
gcloud secrets versions list google-search-api-key

# Update secret
echo -n "new-value" | gcloud secrets versions add secret-name --data-file=-

# Access secret (for debugging)
gcloud secrets versions access latest --secret="secret-name"
```

### Cloud Run Configuration
```yaml
# Equivalent service.yaml for gcloud run services replace
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: wahrify-backend
  annotations:
    run.googleapis.com/launch-stage: GA
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/memory: 4Gi
        run.googleapis.com/cpu: "1"
        run.googleapis.com/timeout: 300s
        run.googleapis.com/concurrency: "80"
        run.googleapis.com/max-instances: "10"
        run.googleapis.com/cloudsql-instances: project:region:instance
    spec:
      containers:
      - image: gcr.io/project/wahrify-backend
        env:
        - name: PYTHONPATH
          value: /app
        resources:
          limits:
            memory: 4Gi
            cpu: "1"
```

## 🔍 Advanced Features

### 🧠 Machine Learning Components

#### Sentence Transformers Integration
- **Model**: `all-MiniLM-L6-v2` (384 dimensions)
- **Purpose**: Generate embeddings for semantic similarity
- **Loading**: Lazy initialization to reduce cold start time
- **Memory**: ~200MB model footprint

```python
# Model usage in code
from app.services.implementations.embedding_generator import EmbeddingGenerator

generator = EmbeddingGenerator()
embedding = await generator.generate_embedding("Your text here")
# Returns: List[float] with 384 dimensions
```

#### CPU-Optimized PyTorch
```dockerfile
# Dockerfile optimization for Cloud Run
RUN pip install torch==2.4.0 --index-url https://download.pytorch.org/whl/cpu
```

### 🔍 Search Intelligence

#### Multi-Stage Search Strategy
1. **Primary Search**: Direct claim text
2. **Expanded Search**: Claim + context keywords  
3. **Technical Search**: Specific terminology extraction
4. **Fallback Search**: Simplified queries

#### Source Credibility Scoring
```python
# Domain credibility factors
domain_scores = {
    "wikipedia.org": 0.85,
    "npr.org": 0.93,
    "scientificamerican.com": 0.86,
    "reddit.com": 0.0,  # Social media gets 0
    "youtube.com": 0.37  # Video content gets lower score
}
```

#### Language Support
- **English**: `lr=lang_en` parameter
- **French**: `lr=lang_fr` parameter  
- **Extensible**: Easy to add more languages

### 🤖 LLM Analysis Engine

#### Structured Prompts
```python
analysis_prompt = """
Analyze this claim based on the provided sources:

Claim: {claim_text}
Context: {context}

Sources:
{formatted_sources}

Provide:
1. Veracity score (0.0-1.0)
2. Confidence level (0.0-1.0)  
3. Evidence-based reasoning
4. Source citations

Format as structured analysis.
"""
```

#### Model Routing
- **Primary**: Llama 3.1 70B Instruct
- **Fallback**: GPT-4 models via OpenRouter
- **Cost Optimization**: Model selection based on complexity

### 📊 Analytics & Monitoring

#### Structured Logging
```python
logger.info(f"🔍 Claim analysis started: {claim_id}")
logger.info(f"📡 Search API call: {search_query}")
logger.info(f"✅ Found {len(sources)} sources")
logger.info(f"🤖 LLM analysis completed: veracity={score}")
```

#### Performance Metrics
- **Cold Start**: ~10-15 seconds (ML model loading)
- **Warm Request**: ~2-5 seconds per analysis
- **Search Latency**: ~1-2 seconds per query
- **Database Query**: ~50-200ms per operation

#### Error Tracking
```python
# Comprehensive error handling
try:
    result = await search_service.search(query)
except GoogleSearchAPIError as e:
    logger.error(f"Search API failed: {e}")
    # Fallback to cached results or alternative search
except OpenRouterAPIError as e:
    logger.error(f"LLM API failed: {e}")
    # Fallback to simpler analysis
```

## 🔐 Security & Compliance

### Authentication & Authorization
```python
# JWT token validation
@router.post("/claims/analyze")  
async def analyze_claim(
    data: ClaimCreate,
    current_user: User = Depends(get_current_user)  # JWT validation
):
    # User can only access their own claims
    return await claim_service.analyze(data, user_id=current_user.id)
```

### Data Protection
- **Secrets**: All API keys in Google Secret Manager
- **Database**: Cloud SQL with encryption at rest
- **Transport**: HTTPS only with TLS 1.3
- **Input Validation**: Pydantic schemas on all endpoints

### Rate Limiting
```python
# Cloud Run automatic scaling with limits
concurrency: 80          # Max requests per instance
max_instances: 10        # Scale limit
timeout: 300s           # Request timeout
```

### CORS Configuration
```python
# Production CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wahrify-fact-checker.web.app",     # Firebase Hosting
        "https://your-frontend-domain.com",         # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## 📈 Monitoring & Observability

### Google Cloud Monitoring
```bash
# View real-time metrics
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wahrify-backend" --limit=50

# Monitor specific errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" --limit=20

# Performance metrics
gcloud logging read "textPayload:latency" --limit=10
```

### Custom Dashboards
```yaml
# monitoring.yaml - Custom dashboard
displayName: "Wahrify Backend Monitoring"
mosaicLayout:
  tiles:
  - width: 6
    height: 4
    widget:
      title: "Request Rate"
      xyChart:
        dataSets:
        - timeSeriesQuery:
            filter: resource.type="cloud_run_revision"
            groupByFields: ["resource.labels.service_name"]
```

### Alerting Policies
```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --policy-from-file=alerting-policy.yaml
```

### Log Analysis Queries
```sql
-- BigQuery analysis of logs
SELECT
  timestamp,
  jsonPayload.claim_text,
  jsonPayload.veracity_score,
  jsonPayload.source_count
FROM `project.cloud_run_logs.wahrify_backend`
WHERE jsonPayload.event_type = 'claim_analyzed'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
ORDER BY timestamp DESC
```

## 🚀 Performance Optimization

### Cold Start Optimization
```python
# Lazy loading for ML models
class EmbeddingGenerator:
    def __init__(self):
        self._model = None  # Don't load on init
        
    async def generate_embedding(self, text: str):
        if self._model is None:
            self._initialize_model()  # Load only when needed
        return self._model.encode(text)
```

### Memory Management
```yaml
# Resource allocation
resources:
  limits:
    memory: 4Gi        # Required for ML models
    cpu: "1"           # 1 vCPU sufficient for CPU-only PyTorch
  requests:
    memory: 2Gi        # Minimum for startup
    cpu: "0.5"         # Minimum CPU allocation
```

### Database Connection Pooling
```python
# SQLAlchemy async pool configuration
engine = create_async_engine(
    database_url,
    pool_size=20,           # Connection pool size
    max_overflow=10,        # Additional connections when needed
    pool_timeout=30,        # Wait time for connection
    pool_recycle=1800,      # Recycle connections every 30 min
    pool_pre_ping=True,     # Validate connections before use
)
```

### Caching Strategy
```python
# In-memory caching for domain credibility
@lru_cache(maxsize=1000)
def get_domain_credibility(domain: str) -> float:
    return domain_credibility_lookup(domain)

# Redis caching for search results (future enhancement)
# await redis_client.setex(f"search:{query_hash}", 3600, json.dumps(results))
```

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. ML Models Not Loading
**Symptoms:**
- 503 errors on `/v1/health/ml`
- "ImportError: No module named 'sentence_transformers'" in logs

**Solutions:**
```bash
# Check memory allocation
gcloud run services describe wahrify-backend --region=europe-west1 --format="value(spec.template.spec.containerConcurrency)"

# Increase memory if needed
gcloud run services update wahrify-backend --region=europe-west1 --memory=4Gi

# Check ML dependencies in requirements-minimal.txt
grep -E "torch|sentence-transformers|scikit-learn" requirements-minimal.txt
```

#### 2. Google Search API Issues
**Symptoms:**
- Empty sources array in analysis results
- 400 "INVALID_ARGUMENT" errors in logs

**Debugging:**
```bash
# Test search health endpoint
curl https://your-service-url/v1/health/search

# Check for newlines in secrets (common issue)
gcloud secrets versions access latest --secret="google-search-api-key" | hexdump -C

# Clean secrets if needed
gcloud secrets versions access latest --secret="google-search-api-key" | tr -d '\n' | \
gcloud secrets versions add google-search-api-key --data-file=-
```

#### 3. Database Connection Failures
**Symptoms:**
- "asyncpg.exceptions.CannotConnectNowError" in logs
- 500 errors on database operations

**Solutions:**
```bash
# Check Cloud SQL instance status
gcloud sql instances describe wahrify-db

# Verify database URL format
gcloud secrets versions access latest --secret="database-url"
# Should be: postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance

# Test connection from Cloud Shell
gcloud sql connect wahrify-db --user=wahrify-user --database=mitigation_misinformation_db
```

#### 4. High Latency Issues
**Symptoms:**
- Slow response times (>10 seconds)
- Timeout errors

**Investigation:**
```bash
# Check Cloud Run metrics
gcloud run services describe wahrify-backend --region=europe-west1

# Analyze request logs for bottlenecks
gcloud logging read "resource.type=cloud_run_revision AND textPayload:latency" --limit=20

# Monitor concurrent requests
gcloud logging read "resource.type=cloud_run_revision AND textPayload:'concurrent requests'" --limit=10
```

#### 5. OpenRouter API Failures
**Symptoms:**
- Analysis returns without scores
- "LLM API error" in logs

**Solutions:**
```bash
# Check OpenRouter API key format
gcloud secrets versions access latest --secret="openrouter-api-key"
# Should start with: sk-or-v1-

# Verify account credits
curl -H "Authorization: Bearer $(gcloud secrets versions access latest --secret=openrouter-api-key)" \
  https://openrouter.ai/api/v1/auth/key

# Test with different model
# Update config.py LLAMA_MODEL_NAME if needed
```

### Debug Commands

#### Application Logs
```bash
# Real-time log streaming
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=wahrify-backend"

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50

# Search for specific patterns
gcloud logging read "resource.type=cloud_run_revision AND textPayload:search" --limit=20
```

#### Performance Analysis
```bash
# Request duration analysis
gcloud logging read "
  resource.type=cloud_run_revision 
  AND httpRequest.requestMethod=POST 
  AND httpRequest.requestUrl:/v1/claims/analyze
" --format="csv(timestamp,httpRequest.latency)" --limit=100

# Memory usage monitoring
gcloud logging read "textPayload:memory" --limit=20
```

#### Network Connectivity
```bash
# Test external API connectivity from Cloud Run
gcloud run services proxy wahrify-backend --port=8080 &
curl -X POST http://localhost:8080/v1/admin/test-connectivity
```

## 📊 Cost Optimization

### Resource Optimization
```yaml
# Cost-effective configuration
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/memory: "4Gi"        # Only what's needed for ML
        run.googleapis.com/cpu: "1"             # 1 vCPU sufficient
        run.googleapis.com/max-instances: "10"  # Limit scale to control costs
        run.googleapis.com/concurrency: "80"    # High concurrency = fewer instances
```

### API Cost Management
```python
# OpenRouter cost optimization
MODEL_COSTS = {
    "meta-llama/llama-3.1-70b-instruct": 0.52,  # per 1M tokens
    "anthropic/claude-3-haiku": 0.25,           # cheaper alternative
}

# Use cheaper models for simple claims
def select_model(claim_complexity: float) -> str:
    if claim_complexity < 0.5:
        return "anthropic/claude-3-haiku"
    return "meta-llama/llama-3.1-70b-instruct"
```

### Database Optimization
```bash
# Monitor Cloud SQL usage
gcloud sql operations list --instance=wahrify-db --limit=10

# Optimize queries with indexing
gcloud sql connect wahrify-db --user=wahrify-user
# CREATE INDEX idx_claims_user_id ON claims(user_id);
# CREATE INDEX idx_analysis_claim_id ON analysis(claim_id);
```

## 🔄 CI/CD Pipeline (Future Enhancement)

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Google Cloud
      uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        
    - name: Build and Deploy
      run: |
        gcloud run deploy wahrify-backend \
          --source . \
          --region=europe-west1 \
          --allow-unauthenticated
```

### Terraform Infrastructure
```hcl
# infrastructure/terraform/main.tf
resource "google_cloud_run_service" "wahrify_backend" {
  name     = "wahrify-backend"
  location = "europe-west1"
  
  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/wahrify-backend"
        
        resources {
          limits = {
            memory = "4Gi"
            cpu    = "1"
          }
        }
        
        env {
          name  = "PYTHONPATH"
          value = "/app"
        }
      }
    }
  }
}
```

## 📚 Additional Resources

### Documentation Links
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenRouter API Docs](https://openrouter.ai/docs)

### Monitoring & Debugging
- [Cloud Logging](https://cloud.google.com/logging/docs)
- [Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [Error Reporting](https://cloud.google.com/error-reporting/docs)

### Security Best Practices
- [Cloud Run Security](https://cloud.google.com/run/docs/securing)
- [IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)

---

## 📞 Support & Contact

For issues related to this deployment:

1. **Check Health Endpoints**: Start with `/v1/health/*` endpoints
2. **Review Logs**: Use `gcloud logging read` commands above
3. **Test Components**: Isolate issues with individual service tests
4. **Resource Monitoring**: Check Cloud Run metrics and quotas

**Production Service URL**: `https://wahrify-backend-1010886348729.europe-west1.run.app`

---

*🚀 Built for production-scale fact-checking with Google Cloud Platform - Ultra-comprehensive deployment guide for enterprise-ready misinformation detection.*