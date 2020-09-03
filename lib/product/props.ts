import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';


export interface EksProps extends cdk.StackProps {
    cluster: eks.Cluster
  }
  
  export interface CicdProps extends cdk.StackProps {
    cluster: eks.Cluster,
    deployRole: iam.Role
  }