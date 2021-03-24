import * as cdk from '@aws-cdk/core';
import { CfnParameter, CfnOutput, Fn } from '@aws-cdk/core';
import { ProductTemplate } from '../../../utils/product.model';
import codecommit = require('@aws-cdk/aws-codecommit');
import ecr = require('@aws-cdk/aws-ecr');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import pipelineAction = require('@aws-cdk/aws-codepipeline-actions');
import { codeToECRspec, deployToEKSspec } from '../../../utils/buildspecs';


class PipelineTemplate extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new CfnParameter(this, 'cluster', {
        type: 'String',
        description: 'EKS cluster name where you will deploy the application.'
    });
    const deployRole = new CfnParameter(this, 'deployRole', {
        type: 'String',
        description: 'IAM Role ARN to assume when deploying your code.'
    });
    const repoName = new CfnParameter(this, 'repo-name', {
        type: 'String',
        description: 'Name of the CodeCommit repository you are creating.'
    })

    this.templateOptions.metadata = {
        'AWS::CloudFormation::Interface': {
          ParameterGroups: [
            {
              Label: { default: 'Pipeline Configuration' },
              Parameters: [cluster.logicalId, deployRole.logicalId, repoName.logicalId]
            }
          ],
          ParameterLabels: {
            [cluster.logicalId]: {
              default: 'EKS cluster name where you will deploy the application.'
            },
            [deployRole.logicalId]: {
                default: 'IAM Role ARN to assume when deploying your code.'
            },
            [repoName.logicalId]: {
                default: 'Name of the CodeCommit repository you are creating.'
            },
          }
        }
      }
    
    const repo =  new codecommit.Repository(this, 'codecommit-repo', {
        repositoryName: repoName.valueAsString
    });


    const ecrRepo = new ecr.Repository(this, `ecr-repo`);

    const buildForECR = codeToECRspec(this, ecrRepo.repositoryUri);
    ecrRepo.grantPullPush(buildForECR.role!);

    const deployToEksCluster = deployToEKSspec(this, cdk.Stack.of(this).region, cluster.valueAsString, ecrRepo, deployRole.valueAsString);

    const sourceOutput = new codepipeline.Artifact();
    const pipeline = new codepipeline.Pipeline(this, 'pipeline', {
        stages: [
            {
                stageName: 'Source',
                actions: [ new pipelineAction.CodeCommitSourceAction({
                    actionName: 'CatchSourceFromCode',
                    repository: repo,
                    output: sourceOutput
                })]
            }, {
                stageName: 'Build',
                actions: [ new pipelineAction.CodeBuildAction({
                    actionName: 'BuildAndPushtoECR',
                    input: sourceOutput,
                    project: buildForECR
                })]
            }, {
                stageName: 'DeployToEKScluster',
                actions: [ new pipelineAction.CodeBuildAction({
                    actionName: 'DeployToEKScluster',
                    input: sourceOutput,
                    project: deployToEksCluster
                })]
            }
        ]
    })

    new CfnOutput(this, 'CodeCommitRepository', {
      value: repo.repositoryCloneUrlHttp
    })

    new CfnOutput(this, 'CodePipelineConsole', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view?region=${cdk.Stack.of(this).region}`
    })


  }
}

export const PipelineProductTemplate: ProductTemplate = {
    stack: PipelineTemplate,
    name: 'PipelineProduct'
}