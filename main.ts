import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider, s3 } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, "aws", { region: "ap-northeast-1" });

    new s3.S3Bucket(this, "testbucket");
  }
}

const app = new App();
new MyStack(app, "cdktf-study");
app.synth();
