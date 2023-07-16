#!/usr/bin/env bash

ACCOUNT_ID="${AWS_ACCOUNT_ID}"
REGION="ap-northeast-1"
ECR_REPOSITORY_NAME="ecs-on-fargate-example"

ECR_REPOSITORY_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

docker build --platform linux/arm64 -t ${ECR_REPOSITORY_NAME} .
docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_REPOSITORY_URI}:latest

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker push ${ECR_REPOSITORY_URI}:latest
