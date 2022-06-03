import { AwsCustomResource, AwsSdkCall } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { AWSRegion } from "../types";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";


interface SSMParameterReaderProps {
  /**
   * The name of the parameter.
   */
  parameterName: string;

  /**
   * The region the parameter is stored in.
   */
  region: AWSRegion;
}

/**
 * A custom resource that allows one to access resources that are deployed in different regions.
 * This solution was taken from the following StackOverflow post:
 * https://stackoverflow.com/questions/59774627/cloudformation-cross-region-reference
 */
export class SSMParameterReader extends AwsCustomResource {
  constructor(scope: Construct, id: string, props: SSMParameterReaderProps) {
    const { parameterName, region } = props;

    const ssmAwsSdkCall = {
      region,
      service: "SSM",
      action: "getParameter",
      parameters: {
        Name: parameterName,
      },
      physicalResourceId: {
        id: Date.now().toString(),
      },
    } as AwsSdkCall;

    super(scope, id, {
      onUpdate: ssmAwsSdkCall,
      policy: {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "ssm:GetParameter",
            ],
            resources: [
              "*",
            ]
          })
        ],
      },
    });
  }

  public getParameterValue(): string {
    return this.getResponseField("Parameter.Value").toString();
  }
}
