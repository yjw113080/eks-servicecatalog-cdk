import * as cdk from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CfnParameter, CfnOutput, Fn } from '@aws-cdk/core';
import { ProductTemplate } from '../../../utils/product.model';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import { CicdProps } from '../props';
import codecommit = require('@aws-cdk/aws-codecommit');
import ecr = require('@aws-cdk/aws-ecr');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import pipelineAction = require('@aws-cdk/aws-codepipeline-actions');
import { codeToECRspec, deployToEKSspec } from '../../../utils/buildspecs';


class ContainerTemplate extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterArnInput = new CfnParameter(this, 'cluster', {
        type: 'String',
        description: 'EKS cluster ARN where you will deploy the application.'
    });

    this.templateOptions.metadata = {
        'AWS::CloudFormation::Interface': {
          ParameterGroups: [
            {
              Label: { default: 'Container Configuration' },
              Parameters: [clusterArnInput.logicalId]
            }
          ],
          ParameterLabels: {
            [clusterArnInput.logicalId]: {
              default: 'EKS cluster ARN where you will deploy the application.'
            }
          }
        }
      }

    // const cluster = eks.Cluster.fromClusterAttributes(this, 'target-cluster', {
    //       clusterName: ''
    //   })
  }
}

export const ContainerProductTemplate: ProductTemplate = {
    stack: ContainerTemplate,
    name: 'ContainerProduct'
}