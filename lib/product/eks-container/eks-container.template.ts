import * as cdk from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CfnParameter, CfnOutput, Fn } from '@aws-cdk/core';
import { ProductTemplate } from '../../../utils/product.model';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import codecommit = require('@aws-cdk/aws-codecommit');
import ecr = require('@aws-cdk/aws-ecr');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import pipelineAction = require('@aws-cdk/aws-codepipeline-actions');
import { codeToECRspec, deployToEKSspec } from '../../../utils/buildspecs';
import { readYamlFromDir } from './read-file';


class ContainerTemplate extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterNameInput = new CfnParameter(this, 'cluster', {
        type: 'String',
        description: 'EKS cluster name where you will deploy the application.'
    });

    const kubectlRoleArn = new CfnParameter(this, 'kubectl-role', {
      type: 'String',
      description: 'IAM Role ARN which can issue requests to create container resources on your behalf. If you do not have information, please reach out to IT support (XX-YYYY-ZZZZ).'
    })

    this.templateOptions.metadata = {
        'AWS::CloudFormation::Interface': {
          ParameterGroups: [
            {
              Label: { default: 'Container Configuration' },
              Parameters: [clusterNameInput.logicalId, kubectlRoleArn.logicalId]
            }
          ],
          ParameterLabels: {
            [clusterNameInput.logicalId]: {
              default: 'EKS cluster name where you will deploy the application.'
            },
            [kubectlRoleArn.logicalId]: {
              default: 'IAM Role ARN which can issue requests to create container resources on your behalf. If you do not have information, please reach out to IT support (XX-YYYY-ZZZZ).'
            }
          }
        }
      }

    const cluster = eks.Cluster.fromClusterAttributes(this, 'target-cluster', {
          clusterName: clusterNameInput.valueAsString,
          kubectlRoleArn: kubectlRoleArn.valueAsString
    });


    readYamlFromDir('lib/product/eks-container/manifest/', cluster);
  }
}

export const ContainerProductTemplate: ProductTemplate = {
    stack: ContainerTemplate,
    name: 'ContainerProduct'
}