#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ScEksStack } from '../lib/sc-eks-stack';

const app = new cdk.App();

const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;

new ScEksStack(app, 'ScEksStack', {
    env: {
        account,
        region: 'us-east-1'
    }
});
