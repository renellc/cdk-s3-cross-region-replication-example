import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";


interface S3CrossRegionReplicationStackProps extends StackProps {
  /**
   * The buckets that should be replicated to.
   */
  replicationBuckets: string[];
}

export class S3CrossRegionReplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: S3CrossRegionReplicationStackProps) {
    super(scope, id, props);

    // Creates the bucket
    //
    // s3.CfnBucket is used over s3.Bucket because as of 2022-04-11, there is no direct way to add a replication rule
    // other than accessing the CloudFormation object directly.
    const bucket = new s3.CfnBucket(this, `test-bucket-${this.region}`, {
      // Optional: Add a bucket name (must not be the same as the bucket ID)
      // bucketName: YOUR_BUCKET_NAME
      publicAccessBlockConfiguration: {
        blockPublicPolicy: true,
        blockPublicAcls: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      // Versioning is required for Cross-Region Replication
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // If no replication buckets are provided, then don't create the IAM role and replication rules
    if (props?.replicationBuckets && props.replicationBuckets.length > 0) {
      // The simplest IAM role required for Cross-Region Replication
      const replRole = new iam.Role(this, `crr-replication-role-${this.region}`, {
        path: "/service-role/",
        assumedBy: new iam.ServicePrincipal("s3.amazonaws.com"),
      });

      replRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
        ],
        resources: [
          bucket.attrArn,
        ]
      }));

      replRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionTagging",
        ],
        resources: [
          `${bucket.attrArn}/*`,
        ]
      }));

      if (props?.replicationBuckets && props.replicationBuckets.length > 0) {
        replRole.addToPolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:ReplicateObject",
            "s3:ReplicateDelete",
            "s3:ReplicateTags",
          ],
          resources: props?.replicationBuckets.map(bucketArn => `${bucketArn}/*`),
        }));
      }

      const rules: s3.CfnBucket.ReplicationRuleProperty[] = props.replicationBuckets.map(bucketArn => ({
        destination: {
          bucket: bucketArn,
        },
        status: "Enabled",
      }));

      bucket.replicationConfiguration = {
        role: replRole.roleArn,
        rules: rules,
      }
    }
  }
}
