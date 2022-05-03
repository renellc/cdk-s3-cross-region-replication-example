# S3 Cross-Region Replication Example

A minimal example on how to implement cross-region replication between S3 buckets using AWS CDK.

## Important notes on S3 Cross Region replication

At the time of writing (May 3, 2022), the AWS CDK disallows cross-region references between stacks. There is no
straightforward way to add the bucket automatically in code to the replication roles for a given bucket. This means
that the only way to add a replication bucket for a given source bucket is to deploy the bucket first, and then
manually copy and paste the bucket arn into code.

If in the future the ability to reference cross-region references is added to the AWS CDK and this repo is not
updated, please create an issue and I will update the example accordingly.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
