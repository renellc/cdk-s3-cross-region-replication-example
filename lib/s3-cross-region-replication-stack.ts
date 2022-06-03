import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ReplicableBucket } from "./constructs/ReplicableBucket";
import { AWSRegion } from "./types";


interface S3CrossRegionReplicationStackProps extends StackProps {
  /**
   * The buckets that should be replicated to.
   */
  replicationBucketRegions: AWSRegion[];
}

export class S3CrossRegionReplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: S3CrossRegionReplicationStackProps) {
    super(scope, id, props);
    const { replicationBucketRegions } = props;

    const bucket = new ReplicableBucket(this, `ReplicableBucket-${id}`, {
      bucketName: `replicable-bucket-${this.region}`,
      bucketsToReplicateTo: replicationBucketRegions.map(region => ({
        bucketName: `replicable-bucket-${region}`,
        region: region,
      })),
    });
  }
}
