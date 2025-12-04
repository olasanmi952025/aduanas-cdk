#!/bin/bash
#./test-local.sh
# Script para construir y probar la imagen Docker localmente
#http://localhost:9000/2015-03-31/functions/function/invocations
cd /c/gitkraken/ARKHO/Aduanas/aduanas-cdk/lib/fiscalizacion/lambdas/test-oracle-nodejs-container

docker-compose build
docker-compose up


curl -s -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -H "Content-Type: application/json" -d '{"httpMethod":"GET","path":"/test-oracle"}'