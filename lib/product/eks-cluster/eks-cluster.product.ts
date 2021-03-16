import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';

export class EksClusterProduct extends cdk.Construct {
    public readonly product: CfnCloudFormationProduct;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const product = new CfnCloudFormationProduct(this, 'eks-cluster-product', {
            name: 'EKS Cluster',
            description: 'Standardized EKS Cluster',
            owner: 'Jane Doe',
            provisioningArtifactParameters: [
              {
                info: {
                  LoadTemplateFromURL: 'https://s3.amazonaws.com/aws-quickstart/quickstart-amazon-eks/templates/amazon-eks-entrypoint-new-vpc.template.yaml'
                }
              }
            ]
          });
        this.product = product;
    }
}