import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getProductTemplate } from '../../../utils/product-builder';
import { ContainerProductTemplate } from './eks-container.template';

export class ContainerProduct extends cdk.Construct {
  public readonly product: CfnCloudFormationProduct;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const template = getProductTemplate(ContainerProductTemplate);

        const asset = new Asset(this, 'ContainerProductAsset', {
          path: template.templatePath
        });

        const product = new CfnCloudFormationProduct(this, 'eks-container-product', {
            name: 'Containers on a EKS cluster',
            description: 'Provision containers',
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