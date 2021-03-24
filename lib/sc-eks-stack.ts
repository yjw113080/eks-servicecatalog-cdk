import * as cdk from '@aws-cdk/core';
import * as sc from '@aws-cdk/aws-servicecatalog';
import { CfnLaunchRoleConstraint, CfnPortfolio, CfnPortfolioPrincipalAssociation, CfnPortfolioProductAssociation } from '@aws-cdk/aws-servicecatalog';
import { CfnOutput, CfnParameter } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { EksClusterProduct } from './product/eks-cluster';
import { PipelineProduct } from './product/pipeline';
import { ContainerProduct } from './product/eks-container';

export interface ScProps extends cdk.StackProps {
  enduserRole: iam.Role
}
export class ScEksStack extends cdk.Stack {
  public readonly enduserRole: iam.Role

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


    // 2. Service Catalog PortFolio
    const portfolio = new CfnPortfolio(this, 'eks-portfolio', {
      displayName: 'eks-portfolio',
      providerName: provider.valueAsString,
      description: pfDescription.valueAsString
    })



    // 2-1. Create Products and Associate them with Portfolio
    const eksClusterProduct = new EksClusterProduct(this, 'eks-product');
    const pipelineProduct = new PipelineProduct(this, 'pipeline-product');
    const containerProduct = new ContainerProduct(this, 'container-product');

    const clusterProductAssociation = new CfnPortfolioProductAssociation(this, 'cluster-association', {
      portfolioId: portfolio.ref,
      productId: eksClusterProduct.product.ref
    });

    const pipelineProductAssociation = new CfnPortfolioProductAssociation(this, 'pipeline-association', {
      portfolioId: portfolio.ref,
      productId: pipelineProduct.product.ref
    });

    const containerProductAssociation = new CfnPortfolioProductAssociation(this, 'container-association', {
      portfolioId: portfolio.ref,
      productId: containerProduct.product.ref
    })

    // 2-2. Create Launch Constraints over the products in the portfolio
    const launchRole = new iam.Role(this, 'sc-eks-launch-role', {
      managedPolicies: [
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCommitFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerServiceFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
        

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

    launchRole.assumeRolePolicy?.addStatements(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["sts:AssumeRole"],
      principals: [new iam.AccountRootPrincipal]
    }))

    
    new CfnLaunchRoleConstraint(this, 'launch-role-cluster', {
      portfolioId: portfolio.ref,
      productId: eksClusterProduct.product.ref,
      roleArn: launchRole.roleArn
    }).addDependsOn(clusterProductAssociation)


    new CfnLaunchRoleConstraint(this, 'launch-role-container', {
      portfolioId: portfolio.ref,
      productId: containerProduct.product.ref,
      roleArn: launchRole.roleArn
    }).addDependsOn(containerProductAssociation)

    new CfnLaunchRoleConstraint(this, 'launch-role-pipeline', {
      portfolioId: portfolio.ref,
      productId: pipelineProduct.product.ref,
      roleArn: launchRole.roleArn
    }).addDependsOn(pipelineProductAssociation)




    // 3. Create test users
    const testUser = new iam.Role(this, 'sc-eks-enduser-role', {
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCommitPowerUser'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_ReadOnlyAccess'),
      ],
        
      assumedBy: new iam.AccountRootPrincipal()
    })
    this.enduserRole = testUser


    new CfnPortfolioPrincipalAssociation(this, 'enduser-role', {
      principalType: 'IAM',
      principalArn: testUser.roleArn,
      portfolioId: portfolio.ref
    }).addDependsOn(portfolio);

    new CfnOutput(this, 'enduser-arn', {
      exportName: 'EndUserRole',
      value: testUser.roleArn
    })

    new CfnOutput(this, 'launch-role-arn', {
      exportName: 'LaunchMasterRole',
      value: launchRole.roleArn
    })
  }
}
