import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import * as logs from "aws-cdk-lib/aws-logs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

/**
 * Propiedades para el WebportalStack
 */
export interface WebportalStackProps extends cdk.StackProps {
  stage?: string;
  project?: string;
  client?: string;
  useCase?: string;
  description?: string;
  tags?: { [key: string]: string };
}

/**
 * Stack de Web Portal con múltiples Lambdas y API Gateway
 * Nomenclatura: {project}_{client}_{usecase}_{resource}_{stage}
 */
export class WebportalStack extends cdk.Stack {
  // Propiedades públicas para acceder a los recursos
  public readonly lambdas: {
    [key: string]: lambda.Function | lambda.DockerImageFunction;
  } = {};
  public readonly api: apigateway.RestApi;
  public readonly exportBucket: s3.Bucket;
  public readonly exportTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props?: WebportalStackProps) {
    super(scope, id, props);

    const stage = props?.stage || "";
    const project = props?.project || "";
    const client = props?.client || "";
    const useCase = props?.useCase || "";

    // Función helper para generar nombres con el formato: project_client_usecase_resource_stage
    const generateResourceName = (resource: string): string => {
      return `${project}_${client}_${useCase}_${resource}_${stage}`;
    };

    // Función helper para generar nombres de exports compatibles con CloudFormation (sin underscores)
    const generateExportName = (resource: string): string => {
      return `${project.replace(
        /_/g,
        "-"
      )}-${client}-${useCase}-${resource}-${stage}`;
    };

    // VPC existente para la stack
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVPC', {
      vpcId: 'vpc-07ab3ade7702e8744',
      availabilityZones: ['us-east-1b', 'us-east-1a'],
      privateSubnetIds: ['subnet-009ab6b021d6e8977', 'subnet-037eb54265d07da73'],
      vpcCidrBlock: '10.18.16.0/22'
    });

    const vpcSubnets = {
      subnets: vpc.privateSubnets,
    };

    // Security Group existente para las Lambdas (se hace mutable para ajustar reglas)
    const lambdaSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ExistingLambdaSg',
      'sg-0f46b023f56e5bde4',
      {
        allowAllOutbound: false,
        mutable: true,
      }
    );

    // Permitir salida HTTPS (443) desde Lambdas hacia el VPC (se restringe por CIDR aquí;
    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      "Allow HTTPS egress to SQS endpoint"
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for s3 vpc endpoint'
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.ipv4("10.19.100.242/32"),
      ec2.Port.tcp(443),
      'Allow HTTPS to external webservice (testesb.aduana.cl)'
    );

    // lambdaSecurityGroup.addEgressRule(
    //   ec2.Peer.ipv4("172.20.101.19/32"),
    //   ec2.Port.tcp(443),
    //   'Allow HTTPS to external webservice (testesb.aduana.cl)'
    // );

    // ========================================
    // VPC Endpoint para SQS (privateDnsEnabled = false por restricción)
    // ========================================
    // Security Group para el endpoint (controla acceso al VPCE)
    const sqsEndpointSecurityGroup = new ec2.SecurityGroup(
      this,
      "SqsEndpointSg",
      {
        vpc,
        description: "Controla el acceso privado a SQS",
        allowAllOutbound: true,
      }
    );

    // IMPORTANTE: permitir explícitamente desde el Security Group de la Lambda (SG -> SG).
    // lambdaSecurityGroup es el SG importado arriba (fromSecurityGroupId).
    sqsEndpointSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from Lambda SG to SQS endpoint"
    );

    // Crear el Interface VPC Endpoint con el SG correcto
    const sqsVpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      "SqsVpcEndpoint",
      {
        vpc,
        service: ec2.InterfaceVpcEndpointAwsService.SQS,
        subnets: {
          subnets: vpc.privateSubnets,
        },
        privateDnsEnabled: false,
        securityGroups: [sqsEndpointSecurityGroup],
      }
    );

    // Ahora que existe el SG del endpoint, permitir egress en el SG de la Lambda hacia el SG del endpoint.
    // (lambdaSecurityGroup es mutable porque lo importaste con { mutable: true })
    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(sqsEndpointSecurityGroup.securityGroupId),
      ec2.Port.tcp(443),
      "Allow HTTPS egress to SQS VPCE SG"
    );

    // Construcción del endpoint URL SQS
    const sqsEndpointEntry = cdk.Fn.select(
      0,
      sqsVpcEndpoint.vpcEndpointDnsEntries
    );
    const sqsEndpointHostname = cdk.Fn.select(
      1,
      cdk.Fn.split(":", sqsEndpointEntry)
    );
    const sqsEndpointUrl = cdk.Fn.join("", ["https://", sqsEndpointHostname]);

    // ========================================
    // DynamoDB Interface VPC Endpoint
    // ========================================
    const dynamoDbEndpointSecurityGroup = new ec2.SecurityGroup(
      this,
      "DynamoDbEndpointSg",
      {
        vpc,
        description: "Controla el acceso privado a DynamoDB",
        allowAllOutbound: true,
      }
    );

    // Permitir tráfico HTTPS desde la Lambda hacia el endpoint
    dynamoDbEndpointSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from Lambda SG to DynamoDB endpoint"
    );

    const dynamoDbVpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      "DynamoDbVpcEndpoint",
      {
        vpc,
        service: new ec2.InterfaceVpcEndpointService(
          `com.amazonaws.${this.region}.dynamodb`,
          443
        ),
        subnets: {
          subnets: vpc.privateSubnets,
        },
        privateDnsEnabled: false,
        securityGroups: [dynamoDbEndpointSecurityGroup],
      }
    );

    const dynamoDbEndpointEntry = cdk.Fn.select(
      0,
      dynamoDbVpcEndpoint.vpcEndpointDnsEntries
    );
    const dynamoDbEndpointHostname = cdk.Fn.select(
      1,
      cdk.Fn.split(":", dynamoDbEndpointEntry)
    );
    const dynamoDbEndpointUrl = cdk.Fn.join("", [
      "https://",
      dynamoDbEndpointHostname,
    ]);

    // ========================================
    // S3 Interface VPC Endpoint
    // ========================================
    //const s3EndpointSecurityGroup = new ec2.SecurityGroup(
    //  this,
    //  "S3EndpointSg",
    //  {
    //    vpc,
    //    description: "Controla el acceso privado a s3",
    //    allowAllOutbound: true,
    //  }
    //);

    //s3EndpointSecurityGroup.addIngressRule(
    //  ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId),
    //  ec2.Port.tcp(443),
    //  "Allow HTTPS traffic from Lambda SG to DynamoDB endpoint"
    //);

    //const s3VpcEndpoint = new ec2.InterfaceVpcEndpoint(this, "S3VpcEndpoint", {
    //  vpc,
    //  service: new ec2.InterfaceVpcEndpointService(
    //    `com.amazonaws.${this.region}.s3`,
    //    443
    //  ),
    //  subnets: {
    //    subnets: vpc.privateSubnets,
    //  },
    //  privateDnsEnabled: false,
    //  securityGroups: [s3EndpointSecurityGroup],
    //});

    // const s3EndpointEntry = cdk.Fn.select(
    //   0,
    //   s3VpcEndpoint.vpcEndpointDnsEntries
    // );
    // const s3EndpointHostname = cdk.Fn.select(
    //   1,
    //   cdk.Fn.split(":", s3EndpointEntry)
    // );
    //const s3EndpointUrl = cdk.Fn.join("", ["https://", s3EndpointHostname]);
    const routeTableIds = [
      'rtb-05c75bc291ee2ad61',  // Route table for both private subnets
    ];
    
    // HABILITAR ESTO
    //new ec2.CfnVPCEndpoint(this, 'S3GatewayEndpoint', {
    //  vpcId: vpc.vpcId,
    //  serviceName: `com.amazonaws.${this.region}.s3`,
    //  vpcEndpointType: 'Gateway',
    //  routeTableIds: routeTableIds,
    //});

    // ========================================
    // Crear rol IAM para las lambdas con permisos para CloudWatch
    // ========================================
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      roleName: generateResourceName("lambda_execution_role"),
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
      description: `Execution role for Lambda functions in ${project}-${client}-${useCase} ${stage}`,
    });

    // Agregar permisos adicionales para CloudWatch Logs (necesario para logRetention)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutRetentionPolicy",
          "logs:DeleteLogGroup",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    // Agregar permisos de VPC para que las lambdas puedan crear interfaces de red (ENI)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
        ],
        resources: ["*"],
      })
    );

    // ========================================
    // SQS Queue para exportación de Excel de guías
    // ========================================

    // Dead Letter Queue (DLQ) para mensajes fallidos
    const deadLetterQueue = new sqs.Queue(this, "ExportGuiasDLQ", {
      queueName: generateResourceName("export_guias_dlq"),
      retentionPeriod: cdk.Duration.days(14), // Retener mensajes fallidos por 14 días
    });

    // Cola principal SQS para exportación de guías
    const exportGuiasQueue = new sqs.Queue(this, "ExportGuiasQueue", {
      queueName: generateResourceName("export_guias_queue"),
      visibilityTimeout: cdk.Duration.minutes(15), // Tiempo para procesar el mensaje
      receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
      retentionPeriod: cdk.Duration.days(14), // Retener mensajes por 14 días
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3, // Reintentar 3 veces antes de enviar a DLQ
      },
    });

    // Agregar permisos para que las lambdas puedan enviar mensajes a SQS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
        ],
        resources: [exportGuiasQueue.queueArn, deadLetterQueue.queueArn],
      })
    );

    // ========================================
    // S3 Bucket para almacenar archivos Excel exportados
    // ========================================
    const exportBucket: s3.IBucket = new s3.Bucket(this, "ExportGuiasBucket", {
      bucketName: generateResourceName("export_guias_bucket")
        .toLowerCase()
        .replace(/_/g, "-"),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: "DeleteOldExports",
          enabled: true,
          expiration: cdk.Duration.days(1), // Eliminar archivos después de 1 días
        },
      ],
      removalPolicy: process.env.STAGE === "dev" ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
        resources: [exportBucket.bucketArn, `${exportBucket.bucketArn}/*`],
      })
    );

    // ========================================
    // DynamoDB Table para trackear estado de exportaciones
    // ========================================

    const exportTableName = generateResourceName("export_guias_table_polling");

    const exportTable = new dynamodb.Table(this, "ExportGuiasTablePolling", {
      tableName: exportTableName,
      partitionKey: { name: "requestId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: process.env.STAGE === "dev" ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "ttl",
    });

    exportTable.addGlobalSecondaryIndex({
      indexName: "StatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    exportTable.addGlobalSecondaryIndex({
      indexName: "CreatedAtIndex",
      partitionKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ],
        resources: [exportTable.tableArn],
      })
    );

    // Add permissions for the export-status table
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/export-status`,
        ],
      })
    );

    // Otorgar permisos al bucket y tabla para la lambda role
    exportBucket.grantReadWrite(lambdaRole);
    exportTable.grantReadWriteData(lambdaRole);

    // Asignar a propiedades públicas
    this.exportBucket = exportBucket as s3.Bucket;
    this.exportTable = exportTable;

    // ========================================
    // Lambda: Documentos Webportal (NestJS Docker Container)
    // ========================================
    const documentosWebportalLambda = new lambda.DockerImageFunction(
      this,
      "DocumentosWebportalLambda",
      {
        functionName: generateResourceName("lambda_documentos_webportal"),
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "lambdas/documentos_webportal"),
          {
            platform: Platform.LINUX_AMD64,
          }
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 2048,
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        securityGroups: [lambdaSecurityGroup],
        environment: {
          STAGE: stage,
          PROJECT: project,
          CLIENT: client,
          USE_CASE: useCase,
          FUNCTION_NAME: "documentos_webportal",
          NODE_ENV: "production",
          ORACLE_HOST: process.env.ORACLE_HOST || process.env.DB_HOST || "",
          ORACLE_PORT: process.env.ORACLE_PORT || process.env.DB_PORT || "1521",
          ORACLE_USERNAME:
            process.env.ORACLE_USERNAME || process.env.DB_USERNAME || "",
          ORACLE_PASSWORD:
            process.env.ORACLE_PASSWORD || process.env.DB_PASSWORD || "",
          // Usar serviceName (ORACLE_DATABASE) si está disponible, sino usar SID
          ORACLE_SID: process.env.ORACLE_SID || process.env.DB_SID || "",
          ORACLE_DATABASE:
            process.env.ORACLE_DATABASE ||
            process.env.DB_DATABASE ||
            process.env.ORACLE_SID ||
            "",
          // Configuración de Oracle Instant Client
          ORACLE_CLIENT_LIB_DIR: "/opt/oracle/instantclient_19_3",
          LD_LIBRARY_PATH: "/opt/oracle/instantclient_19_3",
          TNS_ADMIN: "/opt/oracle/instantclient_19_3",
          // Cognito Configuration
          COGNITO_JWKS_URI:
            process.env.COGNITO_JWKS_URI ||
            "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE/.well-known/jwks.json",
          COGNITO_ISSUER:
            process.env.COGNITO_ISSUER ||
            "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE",
          COGNITO_CLIENT_ID:
            process.env.COGNITO_CLIENT_ID || "4unqen0rhebdg89p8cdjquqh8h",
          // CORS
          CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
          // JWT (opcional)
          JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || "",
          // SQS Configuration
          SQS_ENDPOINT_URL: sqsEndpointUrl,
          SQS_QUEUE_URL: exportGuiasQueue.queueUrl,
          // DYNAMO CONFIG
          DYNAMODB_TABLE_NAME: exportTable.tableName,
          DYNAMODB_ENDPOINT_URL: dynamoDbEndpointUrl,
        },
        description: `Lambda documentos-webportal (NestJS Docker) for ${project}-${client}-${useCase} in ${stage}`,
        // logRetention: logs.RetentionDays.ONE_WEEK, // Temporalmente deshabilitado por problemas con el Custom Resource
      }
    );
    this.lambdas["documentos-webportal"] = documentosWebportalLambda;

    // ========================================
    // Lambda: Guias Webportal (NestJS Docker Container)
    // ========================================
    const guiasWebportalLambda = new lambda.DockerImageFunction(
      this,
      "GuiasWebportalLambda",
      {
        functionName: generateResourceName("lambda_guias_webportal"),
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "lambdas/guias_webportal"),
          {
            platform: Platform.LINUX_AMD64,
          }
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 2048,
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        securityGroups: [lambdaSecurityGroup],
        environment: {
          STAGE: stage,
          PROJECT: project,
          CLIENT: client,
          USE_CASE: useCase,
          FUNCTION_NAME: "guias_webportal",
          NODE_ENV: "production",
          ORACLE_HOST: process.env.ORACLE_HOST || process.env.DB_HOST || "",
          ORACLE_PORT: process.env.ORACLE_PORT || process.env.DB_PORT || "1521",
          ORACLE_USERNAME:
            process.env.ORACLE_USERNAME || process.env.DB_USERNAME || "",
          ORACLE_PASSWORD:
            process.env.ORACLE_PASSWORD || process.env.DB_PASSWORD || "",
          // Usar serviceName (ORACLE_DATABASE) si está disponible, sino usar SID
          ORACLE_SID: process.env.ORACLE_SID || process.env.DB_SID || "",
          ORACLE_DATABASE:
            process.env.ORACLE_DATABASE ||
            process.env.DB_DATABASE ||
            process.env.ORACLE_SID ||
            "",
          // Configuración de Oracle Instant Client
          ORACLE_CLIENT_LIB_DIR: "/opt/oracle/instantclient_19_3",
          LD_LIBRARY_PATH: "/opt/oracle/instantclient_19_3",
          TNS_ADMIN: "/opt/oracle/instantclient_19_3",
          // Cognito Configuration
          COGNITO_JWKS_URI:
            process.env.COGNITO_JWKS_URI ||
            "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE/.well-known/jwks.json",
          COGNITO_ISSUER:
            process.env.COGNITO_ISSUER ||
            "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE",
          COGNITO_CLIENT_ID:
            process.env.COGNITO_CLIENT_ID || "4unqen0rhebdg89p8cdjquqh8h",
          // CORS
          CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
          // JWT (opcional)
          JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || "",
          // SQS Configuration para exportación de Excel
          SQS_QUEUE_URL: exportGuiasQueue.queueUrl,
          SQS_ENDPOINT_URL: sqsEndpointUrl,

          DYNAMODB_TABLE_NAME: exportTable.tableName,
          DYNAMODB_ENDPOINT_URL: dynamoDbEndpointUrl,
        },
        description: `Lambda guias-webportal (NestJS Docker) for ${project}-${client}-${useCase} in ${stage}`,
        // logRetention: logs.RetentionDays.ONE_WEEK, // Temporalmente deshabilitado por problemas con el Custom Resource
      }
    );
    this.lambdas["guias-webportal"] = guiasWebportalLambda;

    exportGuiasQueue.grantSendMessages(guiasWebportalLambda);

    // ========================================
    // Lambda: Export Guias Webportal (NestJS Docker Container - SQS Consumer)
    // ========================================
    const exportGuiasWebportalLambda = new lambda.DockerImageFunction(
      this,
      "ExportGuiasWebportalLambda",
      {
        functionName: generateResourceName("lambda_export_guias_webportal"),
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "lambdas/export_guias_webportal"),
          {
            platform: Platform.LINUX_AMD64,
            file: "Dockerfile.lambda",
            exclude: ["node_modules", "coverage", ".git", "*.log"],
          }
        ),
        timeout: cdk.Duration.minutes(15), // Mismo timeout que el visibility timeout de SQS
        memorySize: 2048,
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        securityGroups: [lambdaSecurityGroup],
        environment: {
          STAGE: stage,
          PROJECT: project,
          CLIENT: client,
          USE_CASE: useCase,
          FUNCTION_NAME: "export_guias_webportal",
          NODE_ENV: "production",
          ORACLE_HOST: process.env.ORACLE_HOST || process.env.DB_HOST || "",
          ORACLE_PORT: process.env.ORACLE_PORT || process.env.DB_PORT || "1521",
          ORACLE_USERNAME:
            process.env.ORACLE_USERNAME || process.env.DB_USERNAME || "",
          ORACLE_PASSWORD:
            process.env.ORACLE_PASSWORD || process.env.DB_PASSWORD || "",
          // Usar serviceName (ORACLE_DATABASE) si está disponible, sino usar SID
          ORACLE_SID: process.env.ORACLE_SID || process.env.DB_SID || "",
          ORACLE_DATABASE:
            process.env.ORACLE_DATABASE ||
            process.env.DB_DATABASE ||
            process.env.ORACLE_SID ||
            "",
          // Configuración de Oracle Instant Client
          ORACLE_CLIENT_LIB_DIR: "/opt/oracle/instantclient_19_3",
          LD_LIBRARY_PATH: "/opt/oracle/instantclient_19_3",
          TNS_ADMIN: "/opt/oracle/instantclient_19_3",
          // SQS Configuration
          SQS_QUEUE_URL: exportGuiasQueue.queueUrl,
          SQS_ENDPOINT_URL: sqsEndpointUrl,
          // S3 Configuration
          S3_BUCKET_NAME: exportBucket.bucketName,
          // S3_ENDPOINT_URL: s3EndpointUrl,
          // DynamoDB Configuration
          DYNAMODB_TABLE_NAME: exportTable.tableName,
          DYNAMODB_ENDPOINT_URL: dynamoDbEndpointUrl,
          ENABLE_MOCK_DOCUMENT: "true",
          SOAP_GENERAR_DOCUMENTO_URL: "https://10.19.100.242/VisualDocsCliente/http/GenerarDocumentoService",
        },
        description: `Lambda export-guias-webportal (NestJS Docker) for ${project}-${client}-${useCase} in ${stage} - SQS Consumer`,
        // logRetention: logs.RetentionDays.ONE_WEEK, // Temporalmente deshabilitado por problemas con el Custom Resource
      }
    );
    this.lambdas["export-guias-webportal"] = exportGuiasWebportalLambda;

    // Configurar el evento SQS para que dispare la lambda
    const sqsEventSource = new SqsEventSource(exportGuiasQueue, {
      batchSize: 1, // Procesar un mensaje a la vez debido a la complejidad del procesamiento
      maxBatchingWindow: cdk.Duration.seconds(0), // Procesar inmediatamente
      reportBatchItemFailures: true, // Reportar fallos individuales
    });

    exportGuiasWebportalLambda.addEventSource(sqsEventSource);

    // Otorgar permisos para recibir, eliminar y gestionar mensajes de la cola
    exportGuiasQueue.grantConsumeMessages(exportGuiasWebportalLambda);

    // ========================================
    // API Gateway REST API
    // ========================================
    const apiName = generateResourceName("api");
    this.api = new apigateway.RestApi(this, "WebportalApiGateway", {
      restApiName: apiName,
      description: `API Gateway for ${project}-${client}-${useCase} in ${stage} environment`,
      deployOptions: {
        stageName: stage,
        loggingLevel: apigateway.MethodLoggingLevel.OFF,
        dataTraceEnabled: false,
        metricsEnabled: true,
        tracingEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });

    // ========================================
    // Rutas del API Gateway - Exponer todos los módulos NestJS
    // ========================================
    const documentosResource = this.api.root.addResource("documentos");
    const documentosIntegration = new apigateway.LambdaIntegration(
      documentosWebportalLambda,
      {
        proxy: true,
      }
    );
    const documentosProxyResource = documentosResource.addResource("{proxy+}");
    documentosProxyResource.addMethod("ANY", documentosIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    documentosResource.addMethod("ANY", documentosIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    const guiasResource = this.api.root.addResource("guias");
    const guiasIntegration = new apigateway.LambdaIntegration(
      guiasWebportalLambda,
      {
        proxy: true,
      }
    );
    const guiasProxyResource = guiasResource.addResource("{proxy+}");
    guiasProxyResource.addMethod("ANY", guiasIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    guiasResource.addMethod("ANY", guiasIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });


    // ========================================
    // Outputs - Información de todos los recursos
    // ========================================

    // API Gateway Outputs
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: this.api.url,
      description: "URL of the API Gateway",
      exportName: generateExportName("api-url"),
    });

    new cdk.CfnOutput(this, "ApiGatewayId", {
      value: this.api.restApiId,
      description: "ID of the API Gateway",
      exportName: generateExportName("api-id"),
    });

    // Lambda Outputs - Documentos Webportal
    new cdk.CfnOutput(this, "DocumentosWebportalLambdaName", {
      value: documentosWebportalLambda.functionName,
      description: "Name of the Documentos Webportal Lambda function",
      exportName: generateExportName("lambda-documentos-webportal-name"),
    });

    new cdk.CfnOutput(this, "DocumentosWebportalLambdaArn", {
      value: documentosWebportalLambda.functionArn,
      description: "ARN of the Documentos Webportal Lambda function",
      exportName: generateExportName("lambda-documentos-webportal-arn"),
    });

    // Lambda Outputs - Guias Webportal
    new cdk.CfnOutput(this, "GuiasWebportalLambdaName", {
      value: guiasWebportalLambda.functionName,
      description: "Name of the Guias Webportal Lambda function",
      exportName: generateExportName("lambda-guias-webportal-name"),
    });

    new cdk.CfnOutput(this, "GuiasWebportalLambdaArn", {
      value: guiasWebportalLambda.functionArn,
      description: "ARN of the Guias Webportal Lambda function",
      exportName: generateExportName("lambda-guias-webportal-arn"),
    });

    // Lambda Outputs - Export Guias Webportal
    new cdk.CfnOutput(this, "ExportGuiasWebportalLambdaName", {
      value: exportGuiasWebportalLambda.functionName,
      description:
        "Name of the Export Guias Webportal Lambda function (SQS Consumer)",
      exportName: generateExportName("lambda-export-guias-webportal-name"),
    });

    new cdk.CfnOutput(this, "ExportGuiasWebportalLambdaArn", {
      value: exportGuiasWebportalLambda.functionArn,
      description:
        "ARN of the Export Guias Webportal Lambda function (SQS Consumer)",
      exportName: generateExportName("lambda-export-guias-webportal-arn"),
    });

    // SQS Queue Outputs
    new cdk.CfnOutput(this, "ExportGuiasQueueUrl", {
      value: exportGuiasQueue.queueUrl,
      description: "URL of the SQS Queue for Excel export from guias",
      exportName: generateExportName("sqs-export-guias-queue-url"),
    });

    new cdk.CfnOutput(this, "ExportGuiasQueueArn", {
      value: exportGuiasQueue.queueArn,
      description: "ARN of the SQS Queue for Excel export from guias",
      exportName: generateExportName("sqs-export-guias-queue-arn"),
    });

    new cdk.CfnOutput(this, "ExportGuiasDLQUrl", {
      value: deadLetterQueue.queueUrl,
      description: "URL of the Dead Letter Queue for export guias",
      exportName: generateExportName("sqs-export-guias-dlq-url"),
    });

    // S3 Bucket Outputs
    new cdk.CfnOutput(this, "ExportGuiasBucketName", {
      value: exportBucket.bucketName,
      description: "Name of the S3 bucket for export guias Excel files",
      exportName: generateExportName("s3-export-guias-bucket-name"),
    });

    new cdk.CfnOutput(this, "ExportGuiasBucketArn", {
      value: exportBucket.bucketArn,
      description: "ARN of the S3 bucket for export guias Excel files",
      exportName: generateExportName("s3-export-guias-bucket-arn"),
    });

    // DynamoDB Table Outputs
    new cdk.CfnOutput(this, "ExportGuiasTableName", {
      value: exportTable.tableName,
      description:
        "Name of the DynamoDB table for tracking export guias status",
      exportName: generateExportName("dynamodb-export-guias-table-name"),
    });

    new cdk.CfnOutput(this, "ExportGuiasTableArn", {
      value: exportTable.tableArn,
      description: "ARN of the DynamoDB table for tracking export guias status",
      exportName: generateExportName("dynamodb-export-guias-table-arn"),
    });

    // VPC Endpoint Outputs
    new cdk.CfnOutput(this, "SqsVpcEndpointId", {
      value: sqsVpcEndpoint.vpcEndpointId,
      description: "ID of the VPC Endpoint for SQS",
      exportName: generateExportName("sqs-vpc-endpoint-id"),
    });

    new cdk.CfnOutput(this, "SqsVpcEndpointDnsEntries", {
      value: cdk.Fn.join(", ", sqsVpcEndpoint.vpcEndpointDnsEntries),
      description: "DNS entries for the SQS VPC Endpoint",
      exportName: generateExportName("sqs-vpc-endpoint-dns"),
    });

    // Configuration Outputs
    new cdk.CfnOutput(this, "Project", {
      value: project,
      description: "Project name",
      exportName: generateExportName("project"),
    });

    new cdk.CfnOutput(this, "Client", {
      value: client,
      description: "Client name",
      exportName: generateExportName("client"),
    });

    new cdk.CfnOutput(this, "UseCase", {
      value: useCase,
      description: "Use case prefix",
      exportName: generateExportName("usecase"),
    });

    new cdk.CfnOutput(this, "Stage", {
      value: stage,
      description: "Deployment stage",
      exportName: generateExportName("stage"),
    });

    // ========================================
    // Tags para todos los recursos
    // ========================================
    cdk.Tags.of(this).add("Project", project);
    cdk.Tags.of(this).add("Client", client);
    cdk.Tags.of(this).add("UseCase", useCase);
    cdk.Tags.of(this).add("Stage", stage);
    cdk.Tags.of(this).add("ManagedBy", "CDK");
  }
}
