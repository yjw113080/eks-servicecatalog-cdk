import * as cdk from '@aws-cdk/core';
import { CfnCloudFormationProduct } from '@aws-cdk/aws-servicecatalog';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getProductTemplate } from '../../../utils/product-builder';
import { PipelineProductTemplate } from './pipeline.template';


export class PipelineProduct extends cdk.Construct {
  public readonly product: CfnCloudFormationProduct;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const template = getProductTemplate(PipelineProductTemplate);

        const asset = new Asset(this, 'PipelineProductAsset', {
          path: template.templatePath
        });

        const product = new CfnCloudFormationProduct(this, 'pipeline-product', {
            name: 'CodePipeline with CodeCommit',
            description: 'Standardized CodePipeline for developer to deploy the code to EKS cluster',
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