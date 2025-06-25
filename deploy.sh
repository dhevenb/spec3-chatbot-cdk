#!/bin/bash

# Spec3 Chatbot CDK Deployment Script

set -e

echo "🚀 Starting Spec3 Chatbot CDK Deployment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Please install it with 'npm install -g aws-cdk'"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if CDK is bootstrapped
echo "🔍 Checking CDK bootstrap status..."
if ! cdk list > /dev/null 2>&1; then
    echo "🔄 Bootstrapping CDK..."
    cdk bootstrap
fi

# Show deployment diff
echo "📋 Showing deployment diff..."
cdk diff

# Ask for confirmation
read -p "🤔 Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Deploy the stack
echo "🚀 Deploying the stack..."
cdk deploy --require-approval never

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Next steps:"
echo "1. Update the KNOWLEDGE_BASE_ID environment variable in the Lambda function"
echo "2. Create your Bedrock knowledge base"
echo "3. Test the API endpoints"
echo ""
echo "🔗 Useful commands:"
echo "- View stack outputs: cdk list-exports"
echo "- Destroy stack: cdk destroy"
echo "- View CloudFormation template: cdk synth" 