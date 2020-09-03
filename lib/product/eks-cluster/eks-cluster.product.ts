import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getProductTemplate } from '../../../utils/product-builder';
import { EksClusterProductTemplate } from './eks-cluster.template';

export class EksClusterProduct extends cdk.Construct {
    public readonly product: CfnCloudFormationProduct;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const template = getProductTemplate(EksClusterProductTemplate);

        const asset = new Asset(this, 'EksClusterProductAsset', {
          path: template.templatePath
        });

        const product = new CfnCloudFormationProduct(this, 'eks-cluster-product', {
            name: 'EKS Cluster',
            description: 'Standardized EKS Cluster',
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