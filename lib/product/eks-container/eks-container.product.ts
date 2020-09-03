import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getProductTemplate } from '../../../utils/product-builder';
import { ContainerProductTemplate } from './eks-container.template';

export class EksClusterProduct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const template = getProductTemplate(ContainerProductTemplate);

        const asset = new Asset(this, 'ContainerProductAsset', {
          path: template.templatePath
        });

        new CfnCloudFormationProduct(this, 'eks-container-product', {
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
    
    }
}