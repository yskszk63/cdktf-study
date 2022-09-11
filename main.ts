import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider, s3, iam } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, "aws", { region: "ap-northeast-1" });

    const role = new iam.IamRole(this, "lambda-role", {
      name: "lambda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
    });
    new iam.IamRolePolicyAttachment(this, "lambda-managed-policy", {
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      role: role.name,
    });

    new s3.S3Bucket(this, "testbucket");
  }
}

const app = new App();
new MyStack(app, "cdktf-study");
app.synth();
