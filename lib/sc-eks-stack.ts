import * as cdk from '@aws-cdk/core';
import * as sc from '@aws-cdk/aws-servicecatalog';
import { CfnPortfolio, CfnPortfolioPrincipalAssociation, CfnPortfolioProductAssociation } from '@aws-cdk/aws-servicecatalog';
import { CfnParameter, CfnRefElement, CfnStack } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { EksClusterProduct } from './product/eks-cluster';
import { PipelineProduct } from './product/pipeline';


export class ScEksStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Parameters
    const provider = new CfnParameter(this, 'portfolio-provider', {
      type: 'String',
      description: 'Provider Name',
      default: 'IT Services'
    })

    // const pfName = new CfnParameter(this, 'portfolio-name', {
    //   type: 'String',
    //   description: 'Portfolio Name',
    //   default: 'Service Catalog EKS Reference Architecture'
    // })

    const pfDescription= new CfnParameter(this, 'portfolio-description', {
      type: 'String',
      description: 'Portfolio Description',
      default: 'Service Catalog Portfolio that contains reference architecture products for EKS.'
    })

    // const linkedRole= new CfnParameter(this, 'linked-role', {
    //   type: 'String',
    //   description: '(Optional) The ARN of a role which can execute products in this portfolio.',
    // })

    // const createTestUser = new CfnParameter(this, 'create-test-user', {
    //   type: 'String',
    //   description: 'Type Yes to Create the ServiceCatalogEndusers IAM group. No if you have already created the group',
    //   allowedValues: ['Yes', 'No'],
    //   default: 'Yes'
    // })

    // 2. Service Catalog PortFolio
    const portfolio = new CfnPortfolio(this, 'eks-portfolio', {
      displayName: 'eks-portfolio',
      providerName: provider.valueAsString,
      description: pfDescription.valueAsString
    })

    // 3. Roles
    // if (linkedRole.valueAsString != '') {
    //   new CfnPortfolioPrincipalAssociation(this, 'link-role', {
    //     principalArn: linkedRole.valueAsString,
    //     portfolioId: portfolio.logicalId,
    //     principalType: 'IAM'
    //   })
  
    // }

    const launchRole = new iam.Role(this, 'launch-role', {
      roleName: 'sc-eks-launch-role',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCommitFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerServiceFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
      ],
      inlinePolicies: {'sc-policy': new PolicyDocument({
        statements: [new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ['*'],
          actions: [
            "servicecatalog:ListServiceActionsForProvisioningArtifact",
            "servicecatalog:ExecuteprovisionedProductServiceAction",
            "iam:AddRoleToInstanceProfile",
            "iam:ListRolePolicies",
            "iam:ListPolicies",
            "iam:DeleteRole",
            "iam:GetRole",
            "iam:CreateInstanceProfile",
            "iam:PassRole",
            "iam:DeleteInstanceProfile",
            "iam:ListRoles",
            "iam:RemoveRoleFromInstanceProfile",
            "iam:CreateRole",
            "iam:DetachRolePolicy",
            "iam:AttachRolePolicy",
            "iam:GetRolePolicy",
            "iam:PutRolePolicy",
            "iam:DeleteRolePolicy",
            "cloudformation:DescribeStackResource",
            "cloudformation:DescribeStackResources",
            "cloudformation:GetTemplate",
            "cloudformation:List*",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DescribeStacks",
            "cloudformation:CreateStack",
            "cloudformation:DeleteStack",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DescribeStacks",
            "cloudformation:GetTemplateSummary",
            "cloudformation:SetStackPolicy",
            "cloudformation:ValidateTemplate",
            "cloudformation:UpdateStack" ]
        })]
      })},
      assumedBy: new ServicePrincipal('servicecatalog.amazonaws.com')
    })


    const testUser = new iam.Role(this, 'test-role', {
      roleName: 'ServiceCatalogEnduser',
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess')],
      assumedBy: new iam.AccountRootPrincipal()
    })


    const enduserAssociation = new CfnPortfolioPrincipalAssociation(this, 'enduser-role', {
      principalType: 'IAM',
      principalArn: testUser.roleArn,
      portfolioId: portfolio.ref
    })
    enduserAssociation.addDependsOn(portfolio);

    const eksClusterProduct = new EksClusterProduct(this, 'eks-product');
    const pipelineProduct = new PipelineProduct(this, 'pipeline-product');

    new CfnPortfolioProductAssociation(this, 'cluster-association', {
      portfolioId: portfolio.ref,
      productId: eksClusterProduct.product.ref
    })
    new CfnPortfolioProductAssociation(this, 'pipeline-association', {
      portfolioId: portfolio.ref,
      productId: pipelineProduct.product.ref
    })

  }
}
