
AWS_ACCOUNT ?= 239161478713
REGION ?= us-east-2
ECR_HOST ?= ${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com
ECR_REPO ?= app-release
IMAGE_TAG ?= ${ECR_REPO}:0.0.3
LAMBDA_ALIAS ?= v0_0_3

AWS_ACCOUNT_ID ?= $(shell aws sts get-caller-identity --query "Account" --output text)
REGION ?= us-east-2
ENV ?= dev
ECR_HOST ?= ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
DEPLOYER_ECR_REPO ?= microapps-deployer-${ENV}
DEPLOYER_ECR_TAG ?= ${DEPLOYER_ECR_REPO}:latest
ROUTER_ECR_REPO ?= microapps-router-${ENV}
ROUTERZ_ECR_REPO ?= microapps-routerz-${ENV}
ROUTER_ECR_TAG ?= ${ROUTER_ECR_REPO}:latest

CODEBUILD_CDK_CONTEXT_ARGS ?=
CODEBUILD_SOURCE_VERSION ?= dummy
CODEBUILD_PR_NUMBER := $(shell echo ${CODEBUILD_SOURCE_VERSION} | awk 'BEGIN{FS="/"; } { print $$2 }' )
CODEBUILD_STACK_SUFFIX := $(shell if [[ ${CODEBUILD_SOURCE_VERSION} = pr/* ]] ; then (echo ${CODEBUILD_SOURCE_VERSION} | awk 'BEGIN{FS="/"; } { printf "-pr-%s", $$2 }') ; else echo "" ; fi )
CODEBUILD_REPOS_STACK_NAME := microapps-app-release-${ENV}${CODEBUILD_STACK_SUFFIX}-repos
CODEBUILD_CORE_STACK_NAME := microapps-app-release-${ENV}${CODEBUILD_STACK_SUFFIX}-svcs
CODEBUILD_IMAGE_LABEL := latest # $(shell [[ ${CODEBUILD_SOURCE_VERSION} = pr/* ]] && (echo ${CODEBUILD_SOURCE_VERSION} | awk 'BEGIN{FS="/"; } { printf "pr-%s", $$2 }') || echo "latest")
CODEBUILD_ECR_HOST ?= ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

CODEBUILD_LAMBDA_NAME ?= microapps-app-release-${ENV}${CODEBUILD_STACK_SUFFIX}
CODEBUILD_IMAGE_NAME ?= microapps-app-release-${ENV}${CODEBUILD_STACK_SUFFIX}-repo
CODEBUILD_ECR_TAG ?= ${CODEBUILD_IMAGE_NAME}:${CODEBUILD_IMAGE_LABEL}

help:
	@echo "Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo


copy-router: ../serverless-nextjs-router/dist/index.js ## Copy compiled Next.js Router to output
	-rm .serverless_nextjs/index.js
	cp ../serverless-nextjs-router/dist/index.js .serverless_nextjs/

start: ## Start App Docker Container
	docker-compose up --build

sam-debug: ## Start App w/SAM Local for VS Code Debugging
	-rm .serverless_nextjs/config.json
	cp config.json .serverless_nextjs/
	sam local start-api --debug-port 5859 --warm-containers EAGER

sam-run: ## Start App w/SAM (no debug) for testing of HTTP request routing
	-rm .serverless_nextjs/config.json
	cp config.json .serverless_nextjs/
	sam local start-api


#
# Lambda ECR Publishing
#

aws-ecr-login: ## establish ECR docker login session
	@aws ecr get-login-password --region ${REGION} | docker login \
		--username AWS --password-stdin ${ECR_HOST}

aws-ecr-publish-svc: ## publish updated ECR docker image
	@docker build -f Dockerfile -t ${IMAGE_TAG}  .
	@docker tag ${IMAGE_TAG} ${ECR_HOST}/${IMAGE_TAG}
	@docker tag ${IMAGE_TAG} ${ECR_HOST}/${ECR_REPO}:latest
	@docker push ${ECR_HOST}/${IMAGE_TAG}
	@docker push ${ECR_HOST}/${ECR_REPO}:latest

aws-create-alias-svc: ## Update the lambda function to use latest image
	# Capture the Revision ID of the newly published code
	@echo "Creating new alias, ${LAMBDA_ALIAS}, pointing to ${ECR_HOST}/${IMAGE_TAG}"
	$(eval VERSION:=$$(shell aws lambda update-function-code --function-name ${ECR_REPO} \
		--image-uri ${ECR_HOST}/${IMAGE_TAG} --region=${REGION} \
		--output json --publish \
		| jq -r ".Version"))
	@echo "New Lambda Version: ${ECR_REPO}/${VERSION}"
	@aws lambda create-alias --function-name ${ECR_REPO} \
		--name ${LAMBDA_ALIAS} --function-version '${VERSION}' --region=${REGION}

aws-update-alias-svc: ## Update the lambda function to use latest image
	# Capture the Revision ID of the newly published code
	@echo "Updating existing alias, ${LAMBDA_ALIAS}, pointing to ${ECR_HOST}/${IMAGE_TAG}"
	$(eval VERSION:=$$(shell aws lambda update-function-code --function-name ${ECR_REPO} \
		--image-uri ${ECR_HOST}/${IMAGE_TAG} --region=${REGION} \
		--output json --publish \
		| jq -r ".Version"))
	@echo "New Lambda Version: ${ECR_REPO}/${VERSION}"
	@aws lambda update-alias --function-name ${ECR_REPO} \
		--name ${LAMBDA_ALIAS} --function-version '${VERSION}' --region=${REGION}

#
# MicroApps - Publishing New App Version / Updated HTML
#

microapps-publish: ## publishes a new version of the microapp OR updates HTML
	@dotnet run --project ~/pwrdrvr/microapps-cdk/src/PwrDrvr.MicroApps.DeployTool/


#
# Docker API Gateway Tests
#

curl-home: ## Send test request to local app
	@curl -v -XPOST -H "Content-Type: application/json" \
		http://localhost:9000/2015-03-31/functions/function/invocations \
		--data-binary "@test-payloads/home.json"

#
# CDK
#

codebuild-deploy: ## Perform a CDK / ECR / Lambda Deploy with CodeBuild
	@echo "CODEBUILD_STACK_SUFFIX: ${CODEBUILD_STACK_SUFFIX}"
	@echo "CODEBUILD_REPOS_STACK_NAME: ${CODEBUILD_REPOS_STACK_NAME}"
	@echo "CODEBUILD_CORE_STACK_NAME: ${CODEBUILD_CORE_STACK_NAME}"
	@echo "CODEBUILD_IMAGE_LABEL: ${CODEBUILD_IMAGE_LABEL}"
	@echo "CODEBUILD_PR_NUMBER: ${CODEBUILD_PR_NUMBER}"
	@echo "CODEBUILD_ECR_TAG: ${CODEBUILD_ECR_TAG}"
	@echo "CODEBUILD_DEPLOYER_ECR_TAG: ${CODEBUILD_DEPLOYER_ECR_TAG}"
	@echo "Running CDK Diff - Repos"
	@cdk diff ${CODEBUILD_CDK_CONTEXT_ARGS} ${CODEBUILD_REPOS_STACK_NAME}
	@echo "Running CDK Deploy - Repos"
	@cdk deploy --require-approval never ${CODEBUILD_CDK_CONTEXT_ARGS} ${CODEBUILD_REPOS_STACK_NAME}
	@echo "Running Docker Build / Publish"
	@docker build -f Dockerfile -t ${CODEBUILD_ECR_TAG}  .
	@docker tag ${CODEBUILD_ECR_TAG} ${CODEBUILD_ECR_HOST}/${CODEBUILD_ECR_TAG}
	@docker push ${CODEBUILD_ECR_HOST}/${CODEBUILD_ECR_TAG}
	@echo "Running CDK Diff - Core"
	@cdk diff ${CODEBUILD_CDK_CONTEXT_ARGS} ${CODEBUILD_CORE_STACK_NAME} 
	@echo "Running CDK Deploy - Core"
	@cdk deploy --require-approval never ${CODEBUILD_CDK_CONTEXT_ARGS} ${CODEBUILD_CORE_STACK_NAME}
	@echo "Running Lambda Update"
	@aws lambda update-function-code --function-name ${CODEBUILD_LAMBDA_NAME} \
		--region ${REGION} --image-uri ${CODEBUILD_ECR_HOST}/${CODEBUILD_ECR_TAG} --publish
