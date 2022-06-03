#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3CrossRegionReplicationStack } from '../lib/s3-cross-region-replication-stack';
import { DefaultStackSynthesizer } from "aws-cdk-lib";


const app = new cdk.App();

new S3CrossRegionReplicationStack(app, 'S3CrossRegionReplicationStack-us-west-1', {
  replicationBucketRegions: [
    "us-east-1"
  ],
  synthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
  env: { region: "us-west-1" },
});

new S3CrossRegionReplicationStack(app, 'S3CrossRegionReplicationStack-us-east-1', {
  replicationBucketRegions: [
    "us-west-1"
  ],
  synthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
  env: { region: "us-east-1" },
});
