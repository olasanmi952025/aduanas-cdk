#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebportalStack } from '../lib/webportal/stack';

// Cargar variables de entorno desde .env
try {
  require('dotenv').config();
} catch (error) {
  // Si dotenv no está instalado, continuar sin él
  console.log('dotenv no encontrado, usando variables de entorno del sistema');
}

const app = new cdk.App();

// Obtener configuración desde el contexto, variables de entorno o .env
const stage = app.node.tryGetContext('stage') || process.env.STAGE || '';
const project = app.node.tryGetContext('project') || process.env.PROJECT || '';
const client = app.node.tryGetContext('client') || process.env.CLIENT || '';


const useCase = 'webportal';
const stackName = `${project.replace(/_/g, '-')}-${client}-${useCase}-stack-${stage}`;

// Configuración del perfil AWS
const awsProfile = process.env.AWS_PROFILE || '083843829920_AWS-SNA-DevOps';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const awsAccount = process.env.AWS_ACCOUNT || '083843829920';

// Crear el stack de Webportal con nomenclatura: project_client_usecase_resource_stage
new WebportalStack(app, stackName, {
  stage: stage,
  project: project,
  client: client,
  useCase: useCase,
  description: `Stack for ${project}-${client}-${useCase} in ${stage} environment with multiple Lambdas and API Gateway`,
  env: {
    account: awsAccount,
    region: awsRegion,
  },
  tags: {
    Project: project,
    Client: client,
    UseCase: useCase,
    Stage: stage,
    ManagedBy: 'CDK'
  }
});

app.synth();