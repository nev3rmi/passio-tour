#!/bin/bash

# MinIO Webhook Setup Script
# This script configures MinIO to send bucket events to an n8n webhook

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Configuration variables (modify these for your setup)
MINIO_HOST="${MINIO_HOST:-localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_CONTAINER="${MINIO_CONTAINER:-minio}"
WEBHOOK_NAME="${WEBHOOK_NAME:-n8n}"
WEBHOOK_URL="${WEBHOOK_URL}"
BUCKET_NAME="${BUCKET_NAME}"
EVENTS="${EVENTS:-s3:ObjectCreated:*,s3:ObjectRemoved:*}"

# Function to show usage
show_usage() {
    echo "MinIO Webhook Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Required Options:"
    echo "  --webhook-url URL         n8n webhook URL (e.g., https://n8n.example.com/webhook/minio-upload)"
    echo "  --bucket BUCKET          MinIO bucket name to monitor"
    echo ""
    echo "Optional Options:"
    echo "  --minio-host HOST        MinIO host (default: localhost:9000)"
    echo "  --access-key KEY         MinIO access key (default: minioadmin)"
    echo "  --secret-key KEY         MinIO secret key (default: minioadmin)"
    echo "  --container NAME         MinIO container name (default: minio)"
    echo "  --webhook-name NAME      Webhook identifier (default: n8n)"
    echo "  --events EVENTS          Comma-separated events (default: s3:ObjectCreated:*,s3:ObjectRemoved:*)"
    echo "  --remote                 Use remote server via SSH (requires --ssh-host, --ssh-user, --ssh-pass)"
    echo "  --ssh-host HOST          SSH host address"
    echo "  --ssh-user USER          SSH username"
    echo "  --ssh-pass PASS          SSH password"
    echo ""
    echo "Examples:"
    echo "  # Local setup"
    echo "  $0 --webhook-url https://n8n.example.com/webhook/minio --bucket uploads"
    echo ""
    echo "  # Remote setup via SSH"
    echo "  $0 --webhook-url https://n8n.example.com/webhook/minio --bucket uploads \\"
    echo "     --remote --ssh-host 192.168.31.97 --ssh-user ubuntu --ssh-pass ubuntu"
    echo ""
}

# Parse command line arguments
REMOTE_MODE=false
SSH_HOST=""
SSH_USER=""
SSH_PASS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --webhook-url)
            WEBHOOK_URL="$2"
            shift 2
            ;;
        --bucket)
            BUCKET_NAME="$2"
            shift 2
            ;;
        --minio-host)
            MINIO_HOST="$2"
            shift 2
            ;;
        --access-key)
            MINIO_ACCESS_KEY="$2"
            shift 2
            ;;
        --secret-key)
            MINIO_SECRET_KEY="$2"
            shift 2
            ;;
        --container)
            MINIO_CONTAINER="$2"
            shift 2
            ;;
        --webhook-name)
            WEBHOOK_NAME="$2"
            shift 2
            ;;
        --events)
            EVENTS="$2"
            shift 2
            ;;
        --remote)
            REMOTE_MODE=true
            shift
            ;;
        --ssh-host)
            SSH_HOST="$2"
            shift 2
            ;;
        --ssh-user)
            SSH_USER="$2"
            shift 2
            ;;
        --ssh-pass)
            SSH_PASS="$2"
            shift 2
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$WEBHOOK_URL" ]; then
    print_error "Webhook URL is required"
    show_usage
    exit 1
fi

if [ -z "$BUCKET_NAME" ]; then
    print_error "Bucket name is required"
    show_usage
    exit 1
fi

if [ "$REMOTE_MODE" = true ]; then
    if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_PASS" ]; then
        print_error "Remote mode requires --ssh-host, --ssh-user, and --ssh-pass"
        exit 1
    fi
fi

# Function to execute commands (local or remote)
execute_cmd() {
    local cmd="$1"
    if [ "$REMOTE_MODE" = true ]; then
        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$cmd"
    else
        eval "$cmd"
    fi
}

print_info "Starting MinIO webhook configuration..."
echo ""
print_info "Configuration:"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  Bucket: $BUCKET_NAME"
echo "  Webhook Name: $WEBHOOK_NAME"
echo "  Events: $EVENTS"
echo "  MinIO Host: $MINIO_HOST"
if [ "$REMOTE_MODE" = true ]; then
    echo "  Mode: Remote ($SSH_USER@$SSH_HOST)"
else
    echo "  Mode: Local"
fi
echo ""

# Step 1: Setup MinIO client alias
print_info "Setting up MinIO client alias..."
execute_cmd "docker exec $MINIO_CONTAINER mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY"
print_success "MinIO client configured"

# Step 2: Configure webhook notification
print_info "Configuring webhook notification..."
execute_cmd "docker exec $MINIO_CONTAINER mc admin config set local notify_webhook:$WEBHOOK_NAME endpoint=\"$WEBHOOK_URL\" queue_limit=1000"
print_success "Webhook notification configured"

# Step 3: Restart MinIO to apply configuration
print_info "Restarting MinIO to apply changes..."
execute_cmd "docker exec $MINIO_CONTAINER mc admin service restart local"
sleep 5
print_success "MinIO restarted"

# Step 4: Re-setup alias after restart
print_info "Re-establishing MinIO client connection..."
execute_cmd "docker exec $MINIO_CONTAINER mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY"
print_success "Connection re-established"

# Step 5: Check if bucket exists
print_info "Checking if bucket exists..."
if execute_cmd "docker exec $MINIO_CONTAINER mc ls local/$BUCKET_NAME" &> /dev/null; then
    print_success "Bucket '$BUCKET_NAME' exists"
else
    print_warning "Bucket '$BUCKET_NAME' does not exist. Creating it..."
    execute_cmd "docker exec $MINIO_CONTAINER mc mb local/$BUCKET_NAME"
    print_success "Bucket created"
fi

# Step 6: Add event notification to bucket
print_info "Adding event notification to bucket..."
IFS=',' read -ra EVENT_ARRAY <<< "$EVENTS"
for event in "${EVENT_ARRAY[@]}"; do
    print_info "  Adding event: $event"
    execute_cmd "docker exec $MINIO_CONTAINER mc event add local/$BUCKET_NAME arn:minio:sqs::$WEBHOOK_NAME:webhook --event \"$event\""
done
print_success "Event notifications configured"

# Step 7: Verify configuration
print_info "Verifying webhook configuration..."
echo ""
print_info "Webhook Config:"
execute_cmd "docker exec $MINIO_CONTAINER mc admin config get local notify_webhook:$WEBHOOK_NAME"
echo ""
print_info "Bucket Events:"
execute_cmd "docker exec $MINIO_CONTAINER mc event list local/$BUCKET_NAME arn:minio:sqs::$WEBHOOK_NAME:webhook"

echo ""
print_success "MinIO webhook setup completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Ensure your n8n webhook workflow is active"
echo "  2. Test by uploading a file: mc cp testfile.txt local/$BUCKET_NAME/"
echo "  3. Monitor MinIO logs: docker logs $MINIO_CONTAINER -f"
echo "  4. Check n8n workflow executions"
echo ""
print_info "To remove this webhook configuration:"
echo "  docker exec $MINIO_CONTAINER mc event remove local/$BUCKET_NAME arn:minio:sqs::$WEBHOOK_NAME:webhook"
echo ""
