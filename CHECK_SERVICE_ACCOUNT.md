# 🔍 Check Current Service Account for Cloud Run

## **Run these commands to see which service account is being used:**

### **1. Check Current Cloud Run Service Account**
```bash
gcloud run services describe wahrify-backend \
  --region=europe-west1 \
  --project=wahrify-fact-checker \
  --format="value(spec.template.spec.serviceAccountName)"
```

If this returns nothing, it's using the **default Compute Engine service account**.

### **2. Check Default Compute Engine Service Account**
```bash
# This is likely your current service account:
# PROJECT_NUMBER-compute@developer.gserviceaccount.com

gcloud projects describe wahrify-fact-checker \
  --format="value(projectNumber)"
```

The default service account would be: `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`

### **3. Check Service Account Permissions**
```bash
# Replace with your actual service account email
gcloud projects get-iam-policy wahrify-fact-checker \
  --flatten="bindings[].members" \
  --filter="bindings.members:*compute@developer.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### **4. Alternative: Check ALL Service Accounts**
```bash
gcloud iam service-accounts list --project=wahrify-fact-checker
```

### **5. Check IAM Roles for the Service Account**
```bash
# After you identify the service account, check its roles:
gcloud projects get-iam-policy wahrify-fact-checker \
  --format="table(bindings.role,bindings.members)"
```

## **🎯 What We're Looking For:**

The service account should have one of these roles for Firebase to work:
- ✅ `roles/owner` 
- ✅ `roles/editor`
- ✅ `roles/firebase.admin`
- ✅ `roles/iam.serviceAccountTokenCreator`

## **📋 Common Service Account Patterns:**

### **Default Compute Engine Service Account:**
```
{PROJECT_NUMBER}-compute@developer.gserviceaccount.com
```

### **App Engine Default Service Account:**
```
wahrify-fact-checker@appspot.gserviceaccount.com
```

### **Custom Service Account:**
```
your-custom-name@wahrify-fact-checker.iam.gserviceaccount.com
```

## **⚡ Quick Check Script:**

```bash
#!/bin/bash
echo "=== CURRENT CLOUD RUN SERVICE ACCOUNT ==="
gcloud run services describe wahrify-backend \
  --region=europe-west1 \
  --project=wahrify-fact-checker \
  --format="value(spec.template.spec.serviceAccountName)"

echo -e "\n=== PROJECT NUMBER ==="
PROJECT_NUM=$(gcloud projects describe wahrify-fact-checker --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUM"
echo "Default Compute SA: ${PROJECT_NUM}-compute@developer.gserviceaccount.com"

echo -e "\n=== ALL SERVICE ACCOUNTS ==="
gcloud iam service-accounts list --project=wahrify-fact-checker

echo -e "\n=== IAM POLICY FOR PROJECT ==="
gcloud projects get-iam-policy wahrify-fact-checker \
  --format="table(bindings.role,bindings.members)" \
  | grep -E "(compute@|firebase|editor|owner)"
```

**Please run these commands and let me know:**
1. Which service account is currently being used
2. What permissions/roles it has
3. Then I'll confirm if it can handle Firebase authentication

This will help us determine if we need to create a new service account or if the existing one will work for Firebase! 🔍