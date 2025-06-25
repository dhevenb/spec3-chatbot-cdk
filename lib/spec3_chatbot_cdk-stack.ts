import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import * as path from 'path';

export class Spec3ChatbotCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for the chatbot infrastructure
    const vpc = new ec2.Vpc(this, 'Spec3ChatbotVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // S3 bucket for storing chatbot data and knowledge base documents
    const chatbotBucket = new s3.Bucket(this, 'Spec3ChatbotBucket', {
      bucketName: `spec3-chatbot-data-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'Spec3ChatbotLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add Bedrock permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:ListFoundationModels',
        'bedrock:GetFoundationModel',
        'bedrock:GetInferenceProfile',
        'bedrock:CreateKnowledgeBase',
        'bedrock:DeleteKnowledgeBase',
        'bedrock:GetKnowledgeBase',
        'bedrock:ListKnowledgeBases',
        'bedrock:UpdateKnowledgeBase',
        'bedrock:CreateDataSource',
        'bedrock:DeleteDataSource',
        'bedrock:GetDataSource',
        'bedrock:ListDataSources',
        'bedrock:UpdateDataSource',
        'bedrock:Retrieve',
        'bedrock:RetrieveAndGenerate',
      ],
      resources: ['*'],
    }));

    // Add specific permissions for Nova Premier model
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));

    // Add specific permissions for the Nova Premier inference profile
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:GetInferenceProfile',
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        'arn:aws:bedrock:us-east-1:091702001436:inference-profile/us.amazon.nova-premier-v1:0'
      ],
    }));

    // Add S3 permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [
        chatbotBucket.bucketArn,
        `${chatbotBucket.bucketArn}/*`,
      ],
    }));

    // Lambda function for processing chatbot requests
    const chatbotLambda = new lambda.Function(this, 'Spec3ChatbotFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../spec3-chatbot/lambda-functions/chatbot-lambda')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      role: lambdaRole,
      environment: {
        KNOWLEDGE_BASE_ID: 'CPIDODP3QD',
        MODEL_ARN: 'arn:aws:bedrock:us-east-1:091702001436:inference-profile/us.amazon.nova-premier-v1:0',
      },
    });

    // Lambda function for managing knowledge base
    const knowledgeBaseLambda = new lambda.Function(this, 'Spec3KnowledgeBaseFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../spec3-chatbot/lambda-functions/knowledge-base-lambda')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      role: lambdaRole,
      environment: {
        BEDROCK_ROLE_ARN: lambdaRole.roleArn,
      },
    });

    // API Gateway for the chatbot
    const api = new apigateway.RestApi(this, 'Spec3ChatbotAPI', {
      restApiName: 'Spec3 Chatbot API',
      description: 'API for Spec3 AI Chatbot with Bedrock integration',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Chat endpoint
    const chatResource = api.root.addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(chatbotLambda));

    // Knowledge base management endpoint
    const kbResource = api.root.addResource('knowledge-base');
    kbResource.addMethod('POST', new apigateway.LambdaIntegration(knowledgeBaseLambda));

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(
      new lambda.Function(this, 'HealthCheckFunction', {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../../spec3-chatbot/lambda-functions/health-check-lambda')),
      })
    ));

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'Spec3ChatbotDashboard', {
      dashboardName: 'Spec3-Chatbot-Monitoring',
    });

    // Add metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Chatbot API Requests',
        left: [
          api.metricCount({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Duration',
        left: [
          chatbotLambda.metricDuration({
            period: cdk.Duration.minutes(5),
            statistic: 'Average',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Errors',
        left: [
          chatbotLambda.metricErrors({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
        ],
      }),
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL for the chatbot',
    });

    new cdk.CfnOutput(this, 'ChatbotBucketName', {
      value: chatbotBucket.bucketName,
      description: 'S3 bucket for chatbot data',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the chatbot infrastructure',
    });
  }
}
