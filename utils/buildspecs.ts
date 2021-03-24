import codebuild = require('@aws-cdk/aws-codebuild');
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { PipelineProject } from '@aws-cdk/aws-codebuild';
import * as ecr from '@aws-cdk/aws-ecr';


export function codeToECRspec (scope: cdk.Construct, apprepo: string) :PipelineProject {
    const buildForECR = new codebuild.PipelineProject(scope, `build-to-ecr`, { 
        projectName: `build-to-ecr`,
        environment: {
            buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_DOCKER_18_09_0,
            privileged: true
        },
        environmentVariables: { 'ECR_REPO_URI': {
            value: apprepo
          } },
        buildSpec: codebuild.BuildSpec.fromObject({
            version: "0.2",
            phases: {
                pre_build: {
                    commands: [
                        'env', `$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)`, 
                        'IMAGE_TAG=$CODEBUILD_RESOLVED_SOURCE_VERSION'
                    ]
                },
                build: {
                    commands: [
                        'docker build -t $ECR_REPO_URI:latest .',
                        'docker tag $ECR_REPO_URI:latest $ECR_REPO_URI:$IMAGE_TAG'
                    ]
                },
                post_build: {
                    commands: [
                        'docker push $ECR_REPO_URI:latest',
                        'docker push $ECR_REPO_URI:$IMAGE_TAG'
                    ]
                }
            }
        })
     });

     return buildForECR;

}

export function deployToEKSspec (scope: cdk.Construct, region: string, cluster: string, apprepo: ecr.IRepository, roleToAssume: string) :PipelineProject {
    
    // const buildImageRepo = new ecr.Repository.fromRepository
    const deployBuildSpec = new codebuild.PipelineProject(scope, `deploy-to-eks-${region}`, {
        environment: {
            buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_DOCKER_18_09_0,
            privileged: true
        },
        environmentVariables: { 
            'REGION': { value:  region },
            'CLUSTER_NAME': {  value: cluster },
            'ECR_REPO_URI': {  value: apprepo.repositoryUri } ,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
            version: "0.2",
            phases: {
              install: {
                commands: [
                    'curl -sS -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.18.9/2020-11-02/bin/linux/amd64/kubectl',
                    'chmod +x ./kubectl',
                    'apt-get update && apt-get -y install jq python3-pip python3-dev && pip3 install --upgrade awscli',
                    'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
                    'export PATH=$PWD/:$PATH'
                ]
              },
              build: {
                commands: [
                    `CREDENTIALS=$(aws sts assume-role --role-arn "${roleToAssume}" --role-session-name codebuild-cdk)`,
                    `export AWS_ACCESS_KEY_ID="$(echo \${CREDENTIALS} | jq -r '.Credentials.AccessKeyId')"`,
                    `export AWS_SECRET_ACCESS_KEY="$(echo \${CREDENTIALS} | jq -r '.Credentials.SecretAccessKey')"`,
                    `export AWS_SESSION_TOKEN="$(echo \${CREDENTIALS} | jq -r '.Credentials.SessionToken')"`,
                    `export AWS_EXPIRATION=$(echo \${CREDENTIALS} | jq -r '.Credentials.Expiration')`,
                    `sed -i 's@CONTAINER_IMAGE@'"$ECR_REPO_URI:$TAG"'@' app-deployment.yaml`,
                    'aws eks update-kubeconfig --name $CLUSTER_NAME',
                    'kubectl apply -f app-deployment.yaml'
                ]
              }
            }})
    });

    deployBuildSpec.addToRolePolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster'],
      resources: [`*`],
    }));

    deployBuildSpec.addToRolePolicy(new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [roleToAssume]
    }))

    return deployBuildSpec;

}

