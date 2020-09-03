import * as cdk from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CfnParameter, CfnOutput, Fn, PhysicalName } from '@aws-cdk/core';
import { ProductTemplate } from '../../../utils/product.model';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';


class EksClusterTemplate extends cdk.Stack {
    public readonly cluster: eks.Cluster;
    public readonly deployRole: iam.Role;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterName = new CfnParameter(this, 'EksClusterName');
    const defaultCapacity = new CfnParameter(this, 'EksClusterDefaultCapacity', {
        type: 'Number',
        description: 'How many instances do you need as default NodeGroup? 2 instances will be added if you leave this blank',
        default: 2
    })
    this.templateOptions.metadata = {
        'AWS::CloudFormation::Interface': {
          ParameterGroups: [
            {
              Label: { default: 'Cluster Configuration' },
              Parameters: [clusterName.logicalId, defaultCapacity.logicalId]
            }
          ],
          ParameterLabels: {
            [clusterName.logicalId]: {
              default: 'Name of the EKS cluster you are creating'
            },
            [defaultCapacity.logicalId]: {
                default: 'Number of default worker instances'
            }
          }
        }
      }

    const clusterAdmin = new iam.Role(this, 'AdminRole', {
        assumedBy: new iam.AccountRootPrincipal()
    });

    const cluster = new eks.Cluster(this, 'sc-eks-cluster', {
        clusterName: clusterName.valueAsString,
        version: eks.KubernetesVersion.V1_17,
        mastersRole: clusterAdmin,
        defaultCapacity: defaultCapacity.valueAsNumber,
    });

    this.cluster = cluster;
    this.deployRole = createDeployRole(this, `for-1st-region`, cluster);
  }
}

export const EksClusterProductTemplate: ProductTemplate = {
    stack: EksClusterTemplate,
    name: 'EksClusterProduct'
}

function createDeployRole(scope: cdk.Construct, id: string, cluster: eks.Cluster): iam.Role {
    const role = new iam.Role(scope, id, {
      roleName: PhysicalName.GENERATE_IF_NEEDED,
      assumedBy: new iam.AccountRootPrincipal()
    });
    cluster.awsAuth.addMastersRole(role);
  
    return role;
  }
  
