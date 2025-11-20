# MinIO to n8n Webhook Setup Guide

This guide explains how to configure MinIO to send bucket events to an n8n webhook endpoint.

## Overview

MinIO can send notifications to n8n when files are uploaded, modified, or deleted. This enables automated workflows triggered by file operations.

## Prerequisites

1. MinIO instance running in Docker
2. n8n instance with an active webhook workflow
3. Access to MinIO container (local or via SSH)
4. `sshpass` installed (for remote setup)

## Quick Start

### Local Setup

```bash
./setup-minio-webhook.sh \
  --webhook-url "https://your-n8n.com/webhook/minio-upload" \
  --bucket "your-bucket-name"
```

### Remote Setup (via SSH)

```bash
./setup-minio-webhook.sh \
  --webhook-url "https://your-n8n.com/webhook/minio-upload" \
  --bucket "your-bucket-name" \
  --remote \
  --ssh-host "192.168.31.97" \
  --ssh-user "ubuntu" \
  --ssh-pass "ubuntu"
```

## Configuration Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `--webhook-url` | n8n webhook URL | - | Yes |
| `--bucket` | MinIO bucket to monitor | - | Yes |
| `--minio-host` | MinIO host address | localhost:9000 | No |
| `--access-key` | MinIO access key | minioadmin | No |
| `--secret-key` | MinIO secret key | minioadmin | No |
| `--container` | MinIO container name | minio | No |
| `--webhook-name` | Webhook identifier | n8n | No |
| `--events` | Comma-separated events | s3:ObjectCreated:*,s3:ObjectRemoved:* | No |
| `--remote` | Enable SSH mode | false | No |
| `--ssh-host` | SSH server address | - | For remote |
| `--ssh-user` | SSH username | - | For remote |
| `--ssh-pass` | SSH password | - | For remote |

## Supported Events

MinIO supports these S3 event types:

- `s3:ObjectCreated:*` - Any file creation (upload)
  - `s3:ObjectCreated:Put` - File uploaded via PUT
  - `s3:ObjectCreated:Post` - File uploaded via POST
  - `s3:ObjectCreated:Copy` - File created via copy
  - `s3:ObjectCreated:CompleteMultipartUpload` - Multipart upload completed
- `s3:ObjectRemoved:*` - Any file deletion
  - `s3:ObjectRemoved:Delete` - File deleted
- `s3:ObjectAccessed:*` - File accessed
  - `s3:ObjectAccessed:Get` - File downloaded
  - `s3:ObjectAccessed:Head` - File metadata accessed

## Manual Setup Steps

If you prefer manual configuration:

### 1. Setup MinIO Client Alias

```bash
docker exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
```

### 2. Configure Webhook Notification

```bash
docker exec minio mc admin config set local \
  notify_webhook:n8n \
  endpoint="https://your-n8n.com/webhook/minio-upload" \
  queue_limit=1000
```

### 3. Restart MinIO

```bash
docker exec minio mc admin service restart local
```

Wait 5-10 seconds for MinIO to restart.

### 4. Re-establish Connection

```bash
docker exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
```

### 5. Create Bucket (if needed)

```bash
docker exec minio mc mb local/your-bucket-name
```

### 6. Add Event Notification

```bash
docker exec minio mc event add local/your-bucket-name \
  arn:minio:sqs::n8n:webhook \
  --event "s3:ObjectCreated:*"
```

### 7. Verify Configuration

```bash
# Check webhook config
docker exec minio mc admin config get local notify_webhook:n8n

# List bucket events
docker exec minio mc event list local/your-bucket-name arn:minio:sqs::n8n:webhook
```

## n8n Webhook Configuration

Your n8n workflow needs a Webhook trigger node configured as:

1. **HTTP Method**: POST
2. **Path**: Match your webhook URL path (e.g., `minio-upload`)
3. **Response Mode**: Immediately
4. **Response Code**: 200

### Example Webhook Payload

MinIO sends JSON payloads like this:

```json
{
  "EventName": "s3:ObjectCreated:Put",
  "Key": "your-bucket-name/file.txt",
  "Records": [
    {
      "eventVersion": "2.0",
      "eventSource": "minio:s3",
      "awsRegion": "",
      "eventTime": "2025-11-20T10:30:00.000Z",
      "eventName": "s3:ObjectCreated:Put",
      "userIdentity": {
        "principalId": "minioadmin"
      },
      "requestParameters": {
        "sourceIPAddress": "192.168.31.97"
      },
      "responseElements": {
        "x-amz-request-id": "...",
        "x-minio-deployment-id": "...",
        "x-minio-origin-endpoint": "http://192.168.31.97:9000"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "Config",
        "bucket": {
          "name": "your-bucket-name",
          "ownerIdentity": {
            "principalId": "minioadmin"
          },
          "arn": "arn:aws:s3:::your-bucket-name"
        },
        "object": {
          "key": "file.txt",
          "size": 1234,
          "eTag": "...",
          "contentType": "text/plain",
          "userMetadata": {
            "content-type": "text/plain"
          },
          "sequencer": "..."
        }
      },
      "source": {
        "host": "192.168.31.97",
        "port": "",
        "userAgent": "MinIO (linux; amd64) minio-go/v7.0.0"
      }
    }
  ]
}
```

### n8n Workflow Example

```javascript
// In n8n, extract file information:
const eventName = $input.item.json.EventName;
const bucketName = $input.item.json.Records[0].s3.bucket.name;
const fileName = $input.item.json.Records[0].s3.object.key;
const fileSize = $input.item.json.Records[0].s3.object.size;
const timestamp = $input.item.json.Records[0].eventTime;

return {
  event: eventName,
  bucket: bucketName,
  file: fileName,
  size: fileSize,
  timestamp: timestamp
};
```

## Troubleshooting

### Check MinIO Logs

```bash
docker logs minio -f | grep webhook
```

### Test Webhook Endpoint

```bash
curl -X POST https://your-n8n.com/webhook/minio-upload \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'
```

### Common Issues

1. **404 Not Found**: n8n webhook workflow is not active or URL is incorrect
2. **500 Internal Server Error**: n8n workflow has an error
3. **Connection refused**: n8n server is not accessible from MinIO
4. **SSL errors**: Certificate issues (use `client_cert` and `client_key` if needed)

### View Current Configuration

```bash
# List all webhooks
docker exec minio mc admin config get local notify_webhook

# List bucket events
docker exec minio mc event list local/your-bucket-name
```

### Remove Webhook

```bash
# Remove bucket event
docker exec minio mc event remove local/your-bucket-name arn:minio:sqs::n8n:webhook

# Remove webhook config
docker exec minio mc admin config reset local notify_webhook:n8n

# Restart MinIO
docker exec minio mc admin service restart local
```

## Advanced Configuration

### Multiple Webhooks

You can configure multiple webhooks with different names:

```bash
# Webhook 1
mc admin config set local notify_webhook:n8n1 endpoint="https://n8n1.com/webhook/minio"

# Webhook 2
mc admin config set local notify_webhook:n8n2 endpoint="https://n8n2.com/webhook/files"
```

### Filter by File Type

Use suffix/prefix filters:

```bash
# Only .pdf files
mc event add local/bucket arn:minio:sqs::n8n:webhook \
  --event "s3:ObjectCreated:*" \
  --suffix ".pdf"

# Only files in a specific folder
mc event add local/bucket arn:minio:sqs::n8n:webhook \
  --event "s3:ObjectCreated:*" \
  --prefix "uploads/"
```

### Authentication

If your n8n webhook requires authentication:

```bash
mc admin config set local notify_webhook:n8n \
  endpoint="https://n8n.com/webhook/minio" \
  auth_token="Bearer your-token-here" \
  queue_limit=1000
```

## Environment Variables

You can also use environment variables:

```bash
export WEBHOOK_URL="https://n8n.com/webhook/minio"
export BUCKET_NAME="uploads"
export MINIO_CONTAINER="minio"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"

./setup-minio-webhook.sh
```

## Security Considerations

1. Use HTTPS endpoints in production
2. Implement authentication in n8n webhook
3. Validate webhook payloads in n8n
4. Restrict MinIO access keys
5. Use network policies to limit access
6. Monitor webhook logs for suspicious activity

## Example Use Cases

1. **File Processing Pipeline**: Upload → MinIO → n8n → Process → Store results
2. **Image Optimization**: Upload image → MinIO → n8n → Resize/compress → Save
3. **Document Analysis**: Upload PDF → MinIO → n8n → Extract text → Index
4. **Backup Notifications**: File deleted → MinIO → n8n → Alert team
5. **Data Sync**: Upload → MinIO → n8n → Sync to another service

## Support

For issues with:
- MinIO: Check [MinIO Documentation](https://min.io/docs/)
- n8n: Check [n8n Documentation](https://docs.n8n.io/)
- This script: Check MinIO logs and n8n workflow execution logs
