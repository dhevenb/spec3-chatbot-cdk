# Spec3 Chatbot CDK Infrastructure

This CDK project creates a comprehensive AWS infrastructure for an AI chatbot that integrates with Amazon Bedrock knowledge bases and other data sources.

## Architecture Overview

The infrastructure includes:

- **Amazon Bedrock Integration**: For AI/ML capabilities and knowledge base management
- **API Gateway**: RESTful API endpoints for the chatbot
- **Lambda Functions**: Serverless compute for processing requests
- **VPC**: Secure network infrastructure
- **S3 Bucket**: Storage for chatbot data and knowledge base documents
- **CloudWatch**: Monitoring and logging
- **IAM Roles**: Secure permissions management

## Components

### 1. VPC Infrastructure
- Public and private subnets across 2 availability zones
- NAT Gateway for outbound internet access
- Security groups for network isolation

### 2. Lambda Functions
- **Chatbot Function**: Processes user messages through Bedrock knowledge bases
- **Knowledge Base Management Function**: Manages Bedrock knowledge bases
- **Health Check Function**: API health monitoring

### 3. API Gateway Endpoints
- `POST /chat` - Process chatbot messages
- `POST /knowledge-base` - Manage knowledge bases
- `GET /health` - Health check endpoint

### 4. Amazon Bedrock Integration
- Knowledge base creation and management
- Vector search capabilities
- Document ingestion and processing
- Fallback to direct model invocation

### 5. Monitoring & Logging
- CloudWatch dashboard with key metrics
- Lambda function monitoring
- API Gateway request tracking

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 18+ and npm
3. **AWS CDK** CLI installed globally
4. **Amazon Bedrock** access enabled in your AWS account

## Installation & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Bootstrap CDK (First time only)
```bash
cdk bootstrap
```

### 4. Deploy the Infrastructure
```bash
cdk deploy
```

### 5. Update Knowledge Base ID
After deployment, update the `KNOWLEDGE_BASE_ID` environment variable in the Lambda function with your actual knowledge base ID.

## API Usage

### Chat Endpoint
```bash
curl -X POST https://your-api-gateway-url/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "session_id": "user123"
  }'
```

### Knowledge Base Management
```bash
# Create a new knowledge base
curl -X POST https://your-api-gateway-url/knowledge-base \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create_knowledge_base",
    "name": "MyKnowledgeBase",
    "description": "Knowledge base for my chatbot"
  }'

# List knowledge bases
curl -X POST https://your-api-gateway-url/knowledge-base \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "list_knowledge_bases"
  }'
```

### Health Check
```bash
curl https://your-api-gateway-url/health
```

## Configuration

### Environment Variables
- `KNOWLEDGE_BASE_ID`: Your Bedrock knowledge base ID
- `MODEL_ARN`: Bedrock model ARN for text generation
- `BEDROCK_ROLE_ARN`: IAM role ARN for Bedrock operations

### Customization
You can customize the infrastructure by modifying:
- VPC configuration in the stack
- Lambda function timeout and memory settings
- API Gateway CORS settings
- CloudWatch dashboard metrics

## Security Features

- **VPC Isolation**: Lambda functions run in private subnets
- **IAM Least Privilege**: Minimal required permissions
- **S3 Encryption**: Server-side encryption for data storage
- **API Gateway Security**: CORS and request validation
- **CloudWatch Logging**: Comprehensive audit trail

## Monitoring

The CloudWatch dashboard includes:
- API Gateway request metrics
- Lambda function performance metrics
- Error rates and duration tracking
- Custom business metrics

## Cost Optimization

- **Lambda Provisioned Concurrency**: For consistent performance
- **S3 Lifecycle Policies**: Automatic cleanup of old data
- **CloudWatch Log Retention**: Configurable log retention periods
- **VPC NAT Gateway**: Single NAT gateway for cost efficiency

## Troubleshooting

### Common Issues

1. **Bedrock Access Denied**: Ensure Bedrock is enabled in your AWS account
2. **VPC Connectivity**: Check NAT Gateway and security group configurations
3. **Lambda Timeout**: Increase timeout for knowledge base operations
4. **API Gateway CORS**: Verify CORS settings for your frontend domain

### Debugging

1. Check CloudWatch logs for Lambda functions
2. Monitor API Gateway access logs
3. Verify IAM permissions for Bedrock operations
4. Test VPC connectivity from Lambda functions

## Development

### Local Development
```bash
# Watch for changes
npm run watch

# Run tests
npm test

# Synthesize CloudFormation template
cdk synth
```

### Adding New Features
1. Modify the stack file (`lib/spec3_chatbot_cdk-stack.ts`)
2. Add new Lambda functions or API endpoints as needed
3. Update IAM permissions for new services
4. Test locally before deployment

## Cleanup

To remove all resources:
```bash
cdk destroy
```

**Warning**: This will delete all resources including S3 data. Ensure you have backups if needed.

## Support

For issues and questions:
1. Check CloudWatch logs for detailed error messages
2. Verify AWS service limits and quotas
3. Review IAM permissions and policies
4. Test individual components in isolation

## License

This project is licensed under the MIT License.
