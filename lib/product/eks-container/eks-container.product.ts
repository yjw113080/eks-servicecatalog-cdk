import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getProductTemplate } from '../../../utils/product-builder';


export class ContainerProduct extends cdk.Construct {
  public readonly product: CfnCloudFormationProduct;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const asset = new Asset(this, 'HelmWordpressAsset', {
          path: './templates/helm-wordpress.yaml'
        });

        const product = new CfnCloudFormationProduct(this, 'eks-container-product', {
            name: 'WordPress on EKS cluster',
            description: 'Provision WordPress application using Helm chart over an EKS cluster',
            owner: 'Jane Doe',
            provisioningArtifactParameters: [
              {
                info: {
                  LoadTemplateFromURL: asset.httpUrl
                }
              }
            ]
          });
          this.product = product;
    
    }
}