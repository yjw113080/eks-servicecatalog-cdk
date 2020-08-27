#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ScEksStack } from '../lib/sc-eks-stack';

const app = new cdk.App();
new ScEksStack(app, 'ScEksStack');
