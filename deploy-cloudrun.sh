#!/bin/bash

# Build and deploy to Cloud Run
echo "Building Docker image..."
gcloud builds submit --tag europe-west1-docker.pkg.dev/wahrify-fact-checker/wahrify-backend/wahrify-backend .

echo "Deploying to Cloud Run..."
gcloud run deploy wahrify-backend \
  --image europe-west1-docker.pkg.dev/wahrify-fact-checker/wahrify-backend/wahrify-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="PYTHONPATH=/app" \
  --set-secrets="GOOGLE_SEARCH_API_KEY=google-search-api-key:latest,GOOGLE_SEARCH_ENGINE_ID=google-search-engine-id:latest,OPENROUTER_API_KEY=openrouter-api-key:latest,DATABASE_URL=database-url:latest" \
  --add-cloudsql-instances wahrify-fact-checker:europe-west1:wahrify-db \
  --memory 4Gi \
  --cpu 1 \
  --max-instances 10

echo "Deployment complete!"