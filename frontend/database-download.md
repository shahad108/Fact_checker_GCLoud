# Wahrify Database Export Guide

This guide explains how to export and download your Wahrify database data from Google Cloud SQL to CSV format.

## 🔐 Prerequisites & Authentication

### 1. Install Google Cloud SDK
```bash
# Install gcloud CLI (if not already installed)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud version
```

### 2. Authenticate with Google Cloud
```bash
# Login to your Google Cloud account
gcloud auth login

# Set your project
gcloud config set project wahrify-fact-checker

# Verify authentication
gcloud auth list
gcloud config list
```

### 3. Additional Authentication for Cloud SQL
```bash
# Install Cloud SQL Proxy (for local connections)
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy

# Or on macOS:
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy
```

## 📊 Database Information

- **Instance Name**: `wahrify-db`
- **Project ID**: `wahrify-fact-checker`
- **Region**: `europe-west1`
- **Database**: `mitigation_misinformation_db`
- **Instance Connection**: `wahrify-fact-checker:europe-west1:wahrify-db`

## 🗂️ Available Tables

Based on the database schema:
- `claims` - All submitted claims
- `analysis` - Fact-checking analysis results
- `sources` - Source URLs and credibility data
- `users` - User accounts
- `searches` - Search queries performed
- `domains` - Domain credibility ratings
- `conversations` - Chat conversations
- `messages` - Individual chat messages

## 📥 Method 1: Cloud Storage Export (Recommended)

### Step 1: Create Storage Bucket
```bash
# Create bucket for exports (use unique name)
BUCKET_NAME="wahrify-exports-$(date +%Y%m%d-%H%M)"
gsutil mb gs://$BUCKET_NAME

# Set bucket permissions for Cloud SQL
SQL_SA=$(gcloud sql instances describe wahrify-db --project=wahrify-fact-checker --format="value(serviceAccountEmailAddress)")
gsutil iam ch serviceAccount:$SQL_SA:objectAdmin gs://$BUCKET_NAME
```

### Step 2: Export Claims Data
```bash
# Export all claims
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/claims.csv \
  --database=mitigation_misinformation_db \
  --query="SELECT id, user_id, claim_text, context, language, status, created_at, updated_at FROM claims ORDER BY created_at DESC" \
  --project=wahrify-fact-checker \
  --offload
```

### Step 3: Export Analysis Results
```bash
# First check analysis table structure
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/analysis-structure.csv \
  --database=mitigation_misinformation_db \
  --query="SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'analysis'" \
  --project=wahrify-fact-checker

# Export analysis data (adjust columns based on actual structure)
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/analysis.csv \
  --database=mitigation_misinformation_db \
  --query="SELECT id, claim_id, veracity_score, confidence_score, analysis_text, created_at FROM analysis ORDER BY created_at DESC" \
  --project=wahrify-fact-checker \
  --offload
```

### Step 4: Export Sources Data
```bash
# Export sources with credibility scores
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/sources.csv \
  --database=mitigation_misinformation_db \
  --query="SELECT id, analysis_id, url, title, snippet, domain_name, credibility_score, created_at FROM sources ORDER BY credibility_score DESC" \
  --project=wahrify-fact-checker \
  --offload
```

### Step 5: Export Combined Claims + Analysis
```bash
# Export claims with their analysis results joined
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/claims-with-analysis.csv \
  --database=mitigation_misinformation_db \
  --query="SELECT 'claim_id', 'claim_text', 'claim_status', 'claim_created', 'veracity_score', 'confidence_score', 'analysis_text', 'analysis_created', 'source_count' 
  UNION ALL 
  SELECT 
    c.id::text, 
    c.claim_text, 
    c.status, 
    c.created_at::text,
    COALESCE(a.veracity_score::text, 'N/A'),
    COALESCE(a.confidence_score::text, 'N/A'),
    COALESCE(a.analysis_text, 'No analysis'),
    COALESCE(a.created_at::text, 'N/A'),
    COALESCE((SELECT COUNT(*) FROM sources s WHERE s.analysis_id = a.id)::text, '0')
  FROM claims c 
  LEFT JOIN analysis a ON c.id = a.claim_id 
  ORDER BY c.created_at DESC" \
  --project=wahrify-fact-checker \
  --offload
```

### Step 6: Download CSV Files
```bash
# Download all exported files
gsutil -m cp gs://$BUCKET_NAME/*.csv ./

# Or download specific files
gsutil cp gs://$BUCKET_NAME/claims.csv ./
gsutil cp gs://$BUCKET_NAME/analysis.csv ./
gsutil cp gs://$BUCKET_NAME/sources.csv ./
gsutil cp gs://$BUCKET_NAME/claims-with-analysis.csv ./
```

## 🔌 Method 2: Direct Local Connection

### Step 1: Start Cloud SQL Proxy
```bash
# Start proxy connection (run in separate terminal)
./cloud_sql_proxy -instances=wahrify-fact-checker:europe-west1:wahrify-db=tcp:5432 &

# Or with specific credentials
./cloud_sql_proxy -instances=wahrify-fact-checker:europe-west1:wahrify-db=tcp:5432 -credential_file=path/to/service-account.json &
```

### Step 2: Connect with psql
```bash
# Install PostgreSQL client if needed
# Ubuntu/Debian: sudo apt-get install postgresql-client
# macOS: brew install postgresql

# Connect to database (you'll need the database password)
psql "host=127.0.0.1 port=5432 sslmode=disable dbname=mitigation_misinformation_db user=wahrify-user"
```

### Step 3: Export using psql
```sql
-- Inside psql, export to CSV
\copy claims TO '/tmp/claims.csv' WITH CSV HEADER;
\copy analysis TO '/tmp/analysis.csv' WITH CSV HEADER;
\copy sources TO '/tmp/sources.csv' WITH CSV HEADER;

-- Export combined data
\copy (
  SELECT 
    c.id as claim_id,
    c.claim_text,
    c.context,
    c.language,
    c.status as claim_status,
    c.created_at as claim_created,
    a.veracity_score,
    a.confidence_score,
    a.analysis_text,
    a.created_at as analysis_created,
    (SELECT COUNT(*) FROM sources s WHERE s.analysis_id = a.id) as source_count
  FROM claims c 
  LEFT JOIN analysis a ON c.id = a.claim_id 
  ORDER BY c.created_at DESC
) TO '/tmp/claims_with_analysis.csv' WITH CSV HEADER;
```

## 📄 Method 3: Full Database Backup

```bash
# Export complete database as SQL dump
gcloud sql export sql wahrify-db \
  gs://$BUCKET_NAME/wahrify-complete-backup.sql \
  --database=mitigation_misinformation_db \
  --project=wahrify-fact-checker \
  --offload

# Download the backup
gsutil cp gs://$BUCKET_NAME/wahrify-complete-backup.sql ./
```

## 🎯 Quick Export Script

Create a script `export-wahrify-data.sh`:

```bash
#!/bin/bash

# Configuration
PROJECT_ID="wahrify-fact-checker"
INSTANCE_NAME="wahrify-db"
DATABASE_NAME="mitigation_misinformation_db"
BUCKET_NAME="wahrify-exports-$(date +%Y%m%d-%H%M)"

echo "🚀 Starting Wahrify database export..."

# Create bucket
echo "📦 Creating storage bucket: $BUCKET_NAME"
gsutil mb gs://$BUCKET_NAME

# Set permissions
echo "🔐 Setting bucket permissions..."
SQL_SA=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(serviceAccountEmailAddress)")
gsutil iam ch serviceAccount:$SQL_SA:objectAdmin gs://$BUCKET_NAME

# Export data
echo "📊 Exporting claims data..."
gcloud sql export csv $INSTANCE_NAME \
  gs://$BUCKET_NAME/claims.csv \
  --database=$DATABASE_NAME \
  --query="SELECT id, user_id, claim_text, context, language, status, created_at, updated_at FROM claims ORDER BY created_at DESC" \
  --project=$PROJECT_ID \
  --offload

echo "🔍 Exporting analysis data..."
gcloud sql export csv $INSTANCE_NAME \
  gs://$BUCKET_NAME/analysis.csv \
  --database=$DATABASE_NAME \
  --query="SELECT id, claim_id, veracity_score, confidence_score, analysis_text, created_at FROM analysis ORDER BY created_at DESC" \
  --project=$PROJECT_ID \
  --offload

echo "🌐 Exporting sources data..."
gcloud sql export csv $INSTANCE_NAME \
  gs://$BUCKET_NAME/sources.csv \
  --database=$DATABASE_NAME \
  --query="SELECT id, analysis_id, url, title, snippet, domain_name, credibility_score, created_at FROM sources ORDER BY credibility_score DESC" \
  --project=$PROJECT_ID \
  --offload

# Download files
echo "⬇️ Downloading CSV files..."
gsutil -m cp gs://$BUCKET_NAME/*.csv ./

echo "✅ Export complete! Files downloaded to current directory:"
ls -la *.csv

echo "🗑️ Cleaning up bucket..."
gsutil -m rm -r gs://$BUCKET_NAME

echo "🎉 Done! Your Wahrify data has been exported to CSV files."
```

Make it executable and run:
```bash
chmod +x export-wahrify-data.sh
./export-wahrify-data.sh
```

## 🔧 Troubleshooting

### Permission Issues
```bash
# Ensure you have the necessary roles
gcloud projects add-iam-policy-binding wahrify-fact-checker \
  --member="user:your-email@gmail.com" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding wahrify-fact-checker \
  --member="user:your-email@gmail.com" \
  --role="roles/storage.admin"
```

### Connection Issues
```bash
# Check Cloud SQL instance status
gcloud sql instances describe wahrify-db --project=wahrify-fact-checker

# Check if instance is running
gcloud sql instances list --project=wahrify-fact-checker
```

### Large Export Optimization
```bash
# For large datasets, use compression
gcloud sql export csv wahrify-db \
  gs://$BUCKET_NAME/claims.csv.gz \
  --database=mitigation_misinformation_db \
  --query="SELECT * FROM claims" \
  --project=wahrify-fact-checker \
  --offload
```

## 📋 CSV File Descriptions

- **claims.csv**: All submitted claims with metadata
- **analysis.csv**: Fact-checking results and scores
- **sources.csv**: Source URLs with credibility ratings
- **claims-with-analysis.csv**: Combined view with claims and their analysis
- **domains.csv**: Domain credibility database

## 🔒 Security Notes

1. **Data Privacy**: Downloaded CSV files contain sensitive data - handle securely
2. **Access Control**: Only authorized users should have database access
3. **Cleanup**: Delete temporary buckets and files after use
4. **Audit**: All export operations are logged in Google Cloud

## 📞 Support

For issues with database exports:
- Check Google Cloud Console for detailed error messages
- Verify IAM permissions and project access
- Contact system administrator if authentication fails

---

© 2024 Wahrify.de - All Rights Reserved