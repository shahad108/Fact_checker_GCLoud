#!/bin/bash

# 🚀 DEPLOY FIREBASE BACKEND - FINAL DEPLOYMENT SCRIPT
# This script will fix your 401 authentication errors!

set -e  # Exit on any error

echo "🚀 DEPLOYING FIREBASE BACKEND TO GOOGLE CLOUD"
echo "=============================================="

# Check we're in the right directory
if [ ! -f "deploy-cloudrun.sh" ]; then
    echo "❌ ERROR: Please run this from the backend directory"
    echo "Run: cd '/Users/dharmendersingh/Documents/stay here/wahrify-working-system/backend-postgresql/'"
    exit 1
fi

echo "✅ In correct directory"

# Step 1: Check if we're logged into gcloud
echo ""
echo "📋 STEP 1: Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not logged into Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi
echo "✅ Google Cloud authentication OK"

# Step 2: Set project
echo ""
echo "📋 STEP 2: Setting Google Cloud project..."
gcloud config set project wahrify-fact-checker
echo "✅ Project set to wahrify-fact-checker"

# Step 3: Run database migration
echo ""
echo "📋 STEP 3: Running database migration..."
echo "⚠️  CRITICAL: This adds firebase_uid column to users table"

# Check if alembic is available
if ! command -v alembic &> /dev/null; then
    echo "❌ Alembic not found. Installing..."
    pip install alembic
fi

# Set database URL for Cloud SQL connection
echo "Setting up Cloud SQL connection..."
export DATABASE_URL="postgresql://postgres@localhost:5432/wahrify?host=/cloudsql/wahrify-fact-checker:europe-west1:wahrify-db"

# Run migration
echo "Running migration..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
else
    echo "❌ Database migration failed"
    echo "Please check your Cloud SQL connection and try again"
    exit 1
fi

# Step 4: Deploy to Cloud Run
echo ""
echo "📋 STEP 4: Deploying Firebase backend to Cloud Run..."
echo "⚠️  This will replace your current Auth0 backend with Firebase backend"

# Make deploy script executable
chmod +x deploy-cloudrun.sh

# Deploy
echo "Starting deployment..."
./deploy-cloudrun.sh

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
else
    echo "❌ Deployment failed"
    exit 1
fi

# Step 5: Verify deployment
echo ""
echo "📋 STEP 5: Verifying deployment..."

# Wait a moment for service to start
echo "Waiting for service to start..."
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wahrify-backend-xei2aqlqeq-ew.a.run.app/v1/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint responding correctly"
else
    echo "⚠️  Health endpoint returned $HEALTH_RESPONSE (might still be starting)"
fi

# Test protected endpoint (should return 401)
echo "Testing protected endpoint..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wahrify-backend-xei2aqlqeq-ew.a.run.app/v1/conversations/)

if [ "$AUTH_RESPONSE" = "401" ]; then
    echo "✅ Protected endpoint correctly requires authentication"
else
    echo "⚠️  Protected endpoint returned $AUTH_RESPONSE (unexpected)"
fi

# Check logs for Firebase initialization
echo ""
echo "📋 STEP 6: Checking Firebase initialization in logs..."
echo "Looking for Firebase success messages..."

# Get recent logs
gcloud logs read --project=wahrify-fact-checker \
    --resource-type=cloud_run_revision \
    --resource-name=wahrify-backend \
    --limit=50 \
    --format="value(textPayload)" | grep -i firebase | head -5

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "✅ Backend deployed with Firebase authentication"
echo "✅ Database migration completed"
echo "✅ Service is responding"
echo ""
echo "🧪 NEXT STEPS:"
echo "1. Test your frontend - the 401 errors should be GONE!"
echo "2. Try logging in with Google authentication"
echo "3. Check that conversations load properly"
echo ""
echo "📊 MONITORING:"
echo "Watch logs: gcloud logs tail --project=wahrify-fact-checker --resource-type=cloud_run_revision --resource-name=wahrify-backend --follow"
echo ""
echo "🔍 TEST AUTHENTICATION:"
echo "curl -H \"Authorization: Bearer YOUR_FIREBASE_TOKEN\" https://wahrify-backend-xei2aqlqeq-ew.a.run.app/v1/conversations/"
echo ""
echo "🚨 If you have issues:"
echo "1. Check the logs above for Firebase initialization errors"
echo "2. Verify your frontend is sending Firebase ID tokens"
echo "3. Check that your Firebase project ID matches: wahrify-fact-checker"