import { Construct } from "constructs";
import { BlockPublicAccess, Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { AWSRegion } from "../types";
import { RemovalPolicy } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { SSMParameterReader } from "./SSMParameterReader";


const REPLICABLE_BUCKET_ARN_SSM_PARAM_BASE_NAME = "/replicable-buckets";

interface ReplicableBucketProps {
  bucketName: string;
  bucketsToReplicateTo: {
    bucketName: string;
    region: AWSRegion;
  }[];
}

export class ReplicableBucket extends Construct {
  public readonly bucket: Bucket;
  public readonly bucketArnSSMParameter: StringParameter;

  constructor(scope: Construct, id: string, props: ReplicableBucketProps) {
    super(scope, id);
    const { bucketName, bucketsToReplicateTo } = props;

    this.bucket = new Bucket(this, `ReplicableBucket-${bucketName}`, {
      bucketName: bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
    });

    // Creates the SSM parameter that contains the bucket arn
    this.bucketArnSSMParameter = new StringParameter(this, `ReplicableBucketBucketArn-${bucketName}`, {
      parameterName: `${REPLICABLE_BUCKET_ARN_SSM_PARAM_BASE_NAME}/${bucketName}`,
      stringValue: this.bucket.bucketArn,
    });

    if (bucketsToReplicateTo.length > 0) {
      const replRole = new Role(this, `${bucketName}-replication-role`, {
        path: "/service-role/",
        assumedBy: new ServicePrincipal("s3.amazonaws.com"),
      });

      replRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
        ],
        resources: [
          this.bucket.bucketArn,
        ],
      }));

      replRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionTagging",
        ],
        resources: [
          this.bucket.arnForObjects("*"),
        ],
      }));


      const replicableBucketArns = bucketsToReplicateTo.map(bucket => {
        const replicableBucketReader = new SSMParameterReader(this, `${bucket.bucketName}-SSMParameterReader`, {
          parameterName: `${REPLICABLE_BUCKET_ARN_SSM_PARAM_BASE_NAME}/${bucket.bucketName}`,
          region: bucket.region,
        });

        return replicableBucketReader.getParameterValue();
      });

      replRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags",
        ],
        resources: replicableBucketArns.map(bucketArn => `${bucketArn}/*`),
      }));

      const replConfigRules: CfnBucket.ReplicationRuleProperty[] = replicableBucketArns.map(bucketArn => ({
        destination: {
          bucket: bucketArn,
        },
        status: "Enabled",
      }));

      const bucketCfn = this.bucket.node.defaultChild as CfnBucket;
      bucketCfn.replicationConfiguration = {
        role: replRole.roleArn,
        rules: replConfigRules,
      };
    }
  }
}