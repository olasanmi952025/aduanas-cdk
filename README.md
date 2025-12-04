curl -s "https://fr6c8unko8.execute-api.us-east-1.amazonaws.com/dev/test-oracle"

npx ts-node scripts/list-aws-resources.ts
dotenvx run -- cdk bootstrap
## Comandos Principales

```bash
# Compilar TypeScript
npm run build

# Sintetizar CloudFormation template
npm run synth

# Ver diferencias antes de desplegar
npm run diff

# Desplegar
npm run deploy

# Destruir stack
npm run destroy
```