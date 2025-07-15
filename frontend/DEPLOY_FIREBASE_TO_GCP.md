# 🚀 Deploy Firebase Backend to Google Cloud

## ⚠️ **CRITICAL: Your deployed backend still uses Auth0!**

The 401 errors happen because:
- ✅ Frontend sends **Firebase tokens**
- ❌ Deployed backend expects **Auth0 tokens**

## 🔥 **Step-by-Step Deployment Guide**

### **Step 1: Set Up Firebase Service Account in Google Cloud**

```bash
# 1. Create Firebase service account
gcloud iam service-accounts create firebase-backend-service \
  --description="Firebase authentication for backend" \
  --display-name="Firebase Backend Service"

# 2. Grant Firebase Admin permissions
gcloud projects add-iam-policy-binding wahrify-fact-checker \
  --member="serviceAccount:firebase-backend-service@wahrify-fact-checker.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# 3. Create and download service account key
gcloud iam service-accounts keys create firebase-service-account.json \
  --iam-account=firebase-backend-service@wahrify-fact-checker.iam.gserviceaccount.com
```

### **Step 2: Add Firebase Configuration to Secret Manager**

```bash
# Add service account JSON to Secret Manager
gcloud secrets create firebase-service-account \
  --data-file=firebase-service-account.json \
  --project=wahrify-fact-checker

# Verify the secret was created
gcloud secrets list --project=wahrify-fact-checker
```

### **Step 3: Run Database Migration**

```bash
# Connect to Cloud SQL and run migration
gcloud sql connect wahrify-db --user=postgres --project=wahrify-fact-checker

# OR use Cloud SQL Proxy locally
cloud_sql_proxy -instances=wahrify-fact-checker:europe-west1:wahrify-db=tcp:5432

# Then run migration
cd /path/to/backend
alembic upgrade head
```

### **Step 4: Deploy Updated Backend**

```bash
# Navigate to backend directory
cd /Users/dharmendersingh/Documents/stay\ here/wahrify-working-system/backend-postgresql/

# Run the updated deployment script
./deploy-cloudrun.sh
```

### **Step 5: Verify Deployment**

```bash
# Check deployment status
gcloud run services describe wahrify-backend \
  --region=europe-west1 \
  --project=wahrify-fact-checker

# Check service logs
gcloud logs read --project=wahrify-fact-checker \
  --resource-type=cloud_run_revision \
  --resource-name=wahrify-backend
```

## 🔧 **Alternative: Use Google Cloud Default Credentials**

For production, you can also use default credentials instead of a service account file:

### Option A: Workload Identity (Recommended)
```bash
# Enable Workload Identity for Cloud Run
gcloud run services update wahrify-backend \
  --service-account=firebase-backend-service@wahrify-fact-checker.iam.gserviceaccount.com \
  --region=europe-west1
```

### Option B: Remove Service Account Path
Update `deploy-cloudrun.sh` to NOT include `FIREBASE_SERVICE_ACCOUNT_PATH`:

```bash
--set-env-vars="PYTHONPATH=/app,FIREBASE_PROJECT_ID=wahrify-fact-checker"
# Remove FIREBASE_SERVICE_ACCOUNT_PATH from secrets
```

## 🧪 **Testing After Deployment**

1. **Check backend health:**
   ```bash
   curl https://wahrify-backend-1010886348729.europe-west1.run.app/v1/health
   ```

2. **Test with Firebase token:**
   ```bash
   # Get token from your frontend and test
   curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
        https://wahrify-backend-1010886348729.europe-west1.run.app/v1/conversations/
   ```

3. **Check logs for Firebase initialization:**
   ```bash
   gcloud logs read --project=wahrify-fact-checker \
     --filter="Firebase Admin SDK initialized"
   ```

## 🚨 **Troubleshooting**

### Error: "Firebase Admin SDK not initialized"
- Check that `FIREBASE_PROJECT_ID` is set correctly
- Verify service account has proper permissions
- Check Cloud Run service logs

### Error: "Service account file not found" 
- Verify secret was created: `gcloud secrets list`
- Check secret mounting in Cloud Run
- Consider using default credentials instead

### Error: "Permission denied"
- Ensure service account has `roles/firebase.admin`
- Check IAM policies: `gcloud projects get-iam-policy wahrify-fact-checker`

### Migration Issues
- Backup database before running migration
- Test migration locally first
- Use Cloud SQL Proxy for safe access

## 📋 **Deployment Checklist**

- [ ] Firebase service account created
- [ ] Service account key added to Secret Manager  
- [ ] Database migration completed
- [ ] Backend deployed with updated script
- [ ] Firebase initialization confirmed in logs
- [ ] Authentication tested with real Firebase token
- [ ] Frontend can successfully authenticate

## 🎯 **Expected Result**

After successful deployment:
- ✅ Frontend Firebase tokens accepted
- ✅ 401 errors resolved
- ✅ Users can authenticate successfully
- ✅ Backend logs show "Firebase Admin SDK initialized"

## ⚠️ **IMPORTANT NOTES**

1. **Backup database** before migration
2. **Test in staging** if available
3. **Monitor logs** during deployment
4. **Have rollback plan** ready
5. **Clean up** service account JSON file after deployment