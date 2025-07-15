# Firebase Authentication Setup Guide

## 🔥 **CRITICAL**: Backend Firebase Configuration

### **Step 1: Get Firebase Project ID from Frontend**

The backend MUST use the same Firebase project as the frontend. Check the frontend's `.env` file for:
```bash
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### **Step 2: Create Firebase Service Account**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (same as frontend)
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file

### **Step 3: Backend Environment Variables**

Set these environment variables for the backend:

```bash
# Required - Must match frontend project
FIREBASE_PROJECT_ID=your-project-id

# Path to downloaded service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

### **Step 4: Service Account File Structure**

The downloaded JSON should look like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### **Step 5: Security Best Practices**

1. **Never commit the service account JSON to git**
2. Store it securely outside the project directory
3. Use environment variables for paths
4. Set proper file permissions: `chmod 600 serviceAccountKey.json`

### **Step 6: Production Deployment**

For production environments:
- Use Google Cloud default credentials when possible
- Store service account JSON in secure secret management
- Consider using Workload Identity for GKE deployments

### **Step 7: Testing Configuration**

After setup, test with:
```bash
# Install dependencies
pip install -r requirements.txt

# Run database migration
alembic upgrade head

# Start the backend
python -m uvicorn app.main:app --reload

# Check logs for Firebase initialization success
```

### **Common Issues & Solutions**

**Issue**: `ValueError: Firebase app already initialized`
- **Solution**: Normal behavior, app initializes once

**Issue**: `FileNotFoundError: Service account file not found`
- **Solution**: Check FIREBASE_SERVICE_ACCOUNT_PATH is correct absolute path

**Issue**: `Permission denied reading service account file`
- **Solution**: `chmod 600 /path/to/serviceAccountKey.json`

**Issue**: `Invalid project ID`
- **Solution**: Ensure FIREBASE_PROJECT_ID matches frontend exactly

**Issue**: `Authentication failed` on token verification
- **Solution**: Verify frontend and backend use same Firebase project

### **Token Format Validation**

Firebase ID tokens contain these claims:
```json
{
  "iss": "https://securetoken.google.com/your-project-id",
  "aud": "your-project-id",
  "auth_time": 1234567890,
  "user_id": "firebase-uid",
  "sub": "firebase-uid",
  "iat": 1234567890,
  "exp": 1234567890,
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "picture": "https://...",
  "uid": "firebase-uid"
}
```

The backend will extract:
- `uid` → `firebase_uid` (user identifier)
- `email` → `email` (user email)
- `name` → `username` (display name)