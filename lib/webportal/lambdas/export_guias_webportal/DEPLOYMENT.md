# AWS SAM Deployment Guide

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **SAM CLI** installed (`pip install aws-sam-cli`)
3. **Node.js 20.x** (for Lambda runtime)
4. **PostgreSQL database** (RDS or external)

## Quick Start

### 1. Configure Parameters

Edit `parameters.json` with your values:

```json
{
  "ParameterKey": "DatabaseHost",
  "ParameterValue": "your-rds-endpoint.amazonaws.com"
},
{
  "ParameterKey": "DatabasePassword", 
  "ParameterValue": "your-secure-password"
},
{
  "ParameterKey": "JwtPublicKey",
  "ParameterValue": "-----BEGIN PUBLIC KEY-----\nYOUR_JWT_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----"
},
{
  "ParameterKey": "AuthorizerArn",
  "ParameterValue": "arn:aws:apigateway:region::/restapis/api-id/authorizers/authorizer-id"
},
{
  "ParameterKey": "AuthorizerType",
  "ParameterValue": "COGNITO_USER_POOLS"
}
```

### 2. Build and Deploy

```bash
# Build the application
npm run sam:build

# Deploy with guided setup (first time)
npm run sam:deploy

# Deploy with parameters file (subsequent deployments)
npm run sam:deploy:prod
```

### 3. Test Locally

```bash
# Start local API Gateway
npm run sam:local

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/service/public
```

## Detailed Deployment Steps

### Step 1: Create S3 Bucket for SAM

```bash
aws s3 mb s3://your-sam-deployment-bucket --region us-east-1
```

### Step 2: Update samconfig.toml

Edit `samconfig.toml`:
- Replace `your-sam-deployment-bucket` with your actual bucket name
- Update `region` if different from us-east-1
- Modify `stack_name` if desired

### Step 3: Build Application

```bash
npm run build
sam build
```

### Step 4: Deploy Stack

**First deployment (guided):**
```bash
sam deploy --guided
```

**Subsequent deployments:**
```bash
sam deploy --parameter-overrides file://parameters.json
```

### Step 5: Get API Endpoint

```bash
aws cloudformation describe-stacks \
  --stack-name aduanas-service \
  --query 'Stacks[0].Outputs[?OutputKey==`AduanasServiceApi`].OutputValue' \
  --output text
```

## Environment Variables

The following environment variables are automatically set in Lambda:

- `NODE_ENV=production`
- `DB_HOST` - From parameters
- `DB_PORT` - From parameters  
- `DB_USERNAME` - From parameters
- `DB_PASSWORD` - From parameters
- `DB_NAME` - From parameters
- `JWT_PUBLIC_KEY` - From parameters
- `CORS_ORIGIN` - From parameters

## Database Setup

### Option 1: Use RDS (Included in Template)

The template creates an RDS PostgreSQL instance. Update parameters:

```json
{
  "ParameterKey": "DatabaseHost",
  "ParameterValue": "localhost"  // Will be replaced with RDS endpoint
}
```

### Option 2: External Database

If using external PostgreSQL:

1. Remove RDS resources from `template.yaml`
2. Set `DatabaseHost` parameter to your external endpoint
3. Ensure Lambda security group allows outbound to port 5432

## Security Considerations

1. **JWT Public Key**: Store securely in AWS Systems Manager Parameter Store
2. **Database Password**: Use AWS Secrets Manager
3. **VPC**: Lambda runs in private subnets for security
4. **CORS**: Restrict to your frontend domain
5. **API Gateway Authorizer**: Use existing Cognito User Pool or custom authorizer

## API Gateway Authorizer Options

### Option 1: No Authorizer (Default)
```json
{
  "ParameterKey": "AuthorizerArn",
  "ParameterValue": ""
},
{
  "ParameterKey": "AuthorizerType", 
  "ParameterValue": "NONE"
}
```

### Option 2: Cognito User Pool Authorizer
```json
{
  "ParameterKey": "AuthorizerArn",
  "ParameterValue": "arn:aws:cognito-idp:region:account:userpool/userpool-id"
},
{
  "ParameterKey": "AuthorizerType",
  "ParameterValue": "COGNITO_USER_POOLS"
}
```

### Option 3: Custom Lambda Authorizer
```json
{
  "ParameterKey": "AuthorizerArn",
  "ParameterValue": "arn:aws:lambda:region:account:function:authorizer-function"
},
{
  "ParameterKey": "AuthorizerType",
  "ParameterValue": "TOKEN"
}
```

### Option 4: Request-based Authorizer
```json
{
  "ParameterKey": "AuthorizerArn",
  "ParameterValue": "arn:aws:lambda:region:account:function:request-authorizer"
},
{
  "ParameterKey": "AuthorizerType",
  "ParameterValue": "REQUEST"
}
```

## Monitoring and Logs

```bash
# View CloudWatch logs
sam logs -n AduanasServiceFunction --stack-name aduanas-service --tail

# Monitor API Gateway
aws apigateway get-rest-apis --query 'items[?name==`aduanas-service`]'
```

## Cleanup

```bash
# Delete the stack
aws cloudformation delete-stack --stack-name aduanas-service

# Delete S3 bucket (after stack deletion)
aws s3 rb s3://your-sam-deployment-bucket --force
```

## Troubleshooting

### Common Issues

1. **Lambda timeout**: Increase `Timeout` in template.yaml
2. **Memory issues**: Increase `MemorySize` in template.yaml  
3. **Database connection**: Check VPC configuration and security groups
4. **CORS errors**: Verify `CorsOrigin` parameter

### Debug Commands

```bash
# Validate template
sam validate

# Check build artifacts
ls -la .aws-sam/build/

# Test function locally
sam local invoke AduanasServiceFunction
```

## API Endpoints

After deployment, your API will be available at:

- **Health Check**: `GET /api/health`
- **Public Endpoint**: `GET /service/public`
- **Secured Endpoints**: `GET /service` (requires JWT)
- **Swagger Docs**: `GET /api/docs` (development only)

## Cost Optimization

- Use `db.t3.micro` for development
- Set `DeletionProtection: false` for non-production
- Consider Aurora Serverless for variable workloads
- Use Lambda provisioned concurrency only if needed
