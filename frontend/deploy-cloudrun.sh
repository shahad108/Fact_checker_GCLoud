#!/bin/bash

# Build and deploy to Cloud Run
echo "Building Docker image..."
BUILD_RESULT=$(gcloud builds submit --config cloudbuild.yaml --region europe-west1 --format="value(id)")
BUILD_ID=$(echo $BUILD_RESULT | tr -d '\n')

echo "Build ID: $BUILD_ID"

echo "Deploying to Cloud Run..."
gcloud run deploy wahrify-backend \
  --image europe-west1-docker.pkg.dev/wahrify-fact-checker/wahrify-backend/wahrify-backend:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="PYTHONPATH=/app" \
  --set-secrets="GOOGLE_SEARCH_API_KEY=google-search-api-key:latest,GOOGLE_SEARCH_ENGINE_ID=google-search-engine-id:latest,OPENROUTER_API_KEY=openrouter-api-key:latest,DATABASE_URL=database-url:latest,AUTH0_DOMAIN=auth0-domain:latest,AUTH0_AUDIENCE=auth0-audience:latest" \
  --add-cloudsql-instances wahrify-fact-checker:europe-west1:wahrify-db \
  --memory 4Gi \
  --cpu 1 \
  --max-instances 10

echo "Deployment complete!"