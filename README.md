
# AWS Service Catalog EKS Reference Architecture


## Installation

1. Deploy a CustomResource to provision Helm Charts

    ```
    aws cloudformation create-stack \
    --stack-name awsqs-kubernetes-helm-resource \
    --capabilities CAPABILITY_NAMED_IAM \
    --template-url https://s3.amazonaws.com/aws-quickstart/quickstart-helm-resource-provider/deploy.template.yaml 
    ```

    - If you are curious how this works, please check out [this Quick Start repository](https://github.com/aws-quickstart/quickstart-helm-resource-provider).


2. Make sure you have all the prerequisites to run cdk application. It includes having Node.js, aws cli, credential settings and cdk cli. You can find the details from [this document](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_prerequisites).

3. Clone this repository and deploy 

    ```
    git clone https://github.com/yjw113080/eks-servicecatalog-cdk.git
    cd eks-servicecatalog-cdk
    npm i && npm run build

    ACCOUNT_ID=$(aws sts get-caller-identity|jq -r ".Account")
    cdk bootstrap aws://$ACCOUNT_ID/us-east-1
    cdk deploy --require-approval never
    ```

4. When the cdk application is successfully deployed, you will see the completion message from your terminal.

    ![](static/cdk-stack-completion.png)


## Test the deployed resources
1.  find an ARN of IAM Role which you would assume to test Service Catalog Portfolio.
    ![](static/deploy-result.png)

5. Use the output to assume the role. When you click your login information in upper right corner, you will see find **Swith Role**. Once you click it, you will see the following console to supply the information of the IAM Role you are trying to assume.

    ![](static/assume-role-console.png)


6. When you successfully assumed the role, go to [AWS Service Catalog console](https://console.aws.amazon.com/servicecatalog/home?region=us-east-1&isSceuc=true#/home) where you will see the following products ready for you. 

    ![](static/products-list.png)


### Create EKS Cluster

1. Click **EKS Cluster** to provision the cluster first. Once you do it, you will see the Product details page. Click **Launch Product** button.
    ![](static/product-detail-cluster.png)

7.  Specify the name of the product that you are trying to deploy. Then click `Next`.

    ![](static/product-name.png)

8.  You will see the options you can customize for your EKS cluster. Once you checked all the settings, please proceed by clicking **Next** until you finally see **Launch**.


    Every settings, except two, have default value. You may leave those as they are now when you test, or change any of them as you wish. Other than that, there are two things that you are required to provide.

    - For **Allowed external access CIDR** type `0.0.0.0/0` for convenience of the test. In production environment, please make sure it falls into your organization's security policy.

    - If you want to provison a bastion host, make sure **Provison bastion host** `Enabled` and specify **SSH key name**. If you do not have one, please create one [here](https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#CreateKeyPair:).

9.  When you click **Launch**, you will see the Provisioned product details. You can check out the progress when you click the CloudformationStackARN.

    ![](static/provisioned-detail.png)

    This will take a while. Please give yourself a coffee break. When it is provisioned, the product result will be printed out.

    ![](static/provision-result.png)

10. Want to check out provisioned EKS cluster? Log into the bastion host using the IP address in the ouput section. Use the ssh key you specified. You will be able to see the result as following screenshot, when you run `kubectl get node`.
    ![](static/bastion-kubectl-resut.png)


### Deploy WordPress application over the cluster
11. Next, let's see how we can deploy Container resources over the cluster using Helm Charts. Go back to the Product list, then click **WordPress on EKS cluster**. When you see the Product detail page, click **Launch Product** button.

12. Type the **product name** you will provision, and click Next. Once you hit Next, you will be asked to type the **EKS cluster's name** where your WordPress should be located. Keep clicking **Next** until you see Launch button, and finally click **Launch**.

13. Once the provisioning tasks are completed, you will be able to see the newly added Kubernetes resources by running `kubectl get pod` in the bastion host.

    ![](static/kubectl-result.png)

14. Let's check out the new WordPress we created. Run `kubectl get svc` and find the loadbalancer URL of wordpress application.

    ![](static/kubectl-svc-result.png)

15. Copy and paste the LoadBalancer's URL to your web browser, and you will see the WordPress application running!
    ![](static/wordpress.png)


### Create a CodePipline with CodeCommit
1. Lastly, create a pipeline for developer's new project including CodeCommit repository and Elastic Container Registry. Go back to the Product list, then click **CodePipeline with CodeCommit**. When you see the Product detail page, click **Launch Product** button.


2. Feed the information it needs. It asks you three things.

    ![](static/product-pipeline.png)

    1. EKS cluster name to deploy the new project. This should be Development cluster in real world, but let's use the one we created earlier. You can find the cluster name from the Provisioned product detail.


    2. IAM Role which has a permission to run `kubectl` against the given cluster. In real world, the developer should know which role to use for their developement environment. In this demo, let's use the launch role for convenience. You can find the launch role ARN by running the following command in your terminal: `aws cloudformation describe-stacks --region us-east-1 --stack-name ScEksStack | jq -r ".Stacks[0].Outputs[1].OutputValue" `


    3. The name of CodeCommit repository that you are going to make.

3. When it is completed, you will see the related information as you do in the screenshot.

    ![](static/pipeline-product-result.png)

4. 