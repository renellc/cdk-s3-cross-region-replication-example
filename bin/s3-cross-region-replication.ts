#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3CrossRegionReplicationStack } from '../lib/s3-cross-region-replication-stack';
import { DefaultStackSynthesizer } from "aws-cdk-lib";


const app = new cdk.App();

new S3CrossRegionReplicationStack(app, 'S3CrossRegionReplicationStack-us-west-1', {
  replicationBuckets: [
    // Auto generated ARN after deploying once (copied from the AWS console)
    // Note that CDK disallows cross-region references between stacks. More information can be found at this GitHub
    // issue: https://github.com/aws/aws-cdk/issues/49
    "arn:aws:s3:::s3crossregionreplicationstack-u-testbucketuseast1-refszeqifjmt"
  ],
  synthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
  env: { region: "us-west-1" },
});

new S3CrossRegionReplicationStack(app, 'S3CrossRegionReplicationStack-us-east-1', {
  replicationBuckets: [
    "arn:aws:s3:::s3crossregionreplicationstack-u-testbucketuswest1-17ren9nmy555c"
  ],
  synthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
  env: { region: "us-east-1" },
});
