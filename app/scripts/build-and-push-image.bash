#!/usr/bin/env bash

local ACCOUNT_ID="${AWS_ACCOUNT_ID}"
local REGION="ap-northeast-1"
local ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME}"

ECR_REPOSITORY_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker build . -t ${ECR_REPOSITORY_NAME} .
docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_REPOSITORY_URI}:latest
docker push ${ECR_REPOSITORY_URI}:latest