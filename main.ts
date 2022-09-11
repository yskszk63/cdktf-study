import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { Construct } from "constructs";
import { App, TerraformStack, TerraformAsset, AssetType } from "cdktf";
import { AwsProvider, iam, lambdafunction, apigatewayv2 } from "@cdktf/provider-aws";
import * as esbuild from "esbuild";

class TsFunction extends Construct {
  asset: TerraformAsset;

  constructor(scope: Construct, id: string, props: { path: string }) {
    super(scope, id);

    const wd = path.resolve(path.dirname(props.path));
    esbuild.buildSync({
      entryPoints: [path.basename(props.path)],
      platform: "node",
      target: "es2022",
      bundle: true,
      format: "esm",
      sourcemap: "external",
      outdir: "dist",
      absWorkingDir: wd,
    });
    const dist = path.join(wd, "dist");
    fs.writeFileSync(path.join(dist, "package.json"), '{"type":"module"}');

    this.asset = new TerraformAsset(this, "lambda-asset", {
      path: dist,
      type: AssetType.ARCHIVE,
    });
  }
}

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

    const code = new TsFunction(this, "code", {
      path: fileURLToPath(new URL("./app/index.ts", import.meta.url)),
    });

    const lambda = new lambdafunction.LambdaFunction(this, "api", {
      functionName: "cdktf-study-function",
      handler: "index.handler",
      runtime: "nodejs16.x",
      role: role.arn,
      filename: code.asset.path,
      sourceCodeHash: code.asset.assetHash,
    });

    const api = new apigatewayv2.Apigatewayv2Api(this, "api-gw", {
      name: "cdktf-study-api",
      protocolType: "HTTP",
      target: lambda.arn,
    });

    new lambdafunction.LambdaPermission(this, "api-gw-lambda", {
      functionName: lambda.functionName,
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });
  }
}

const app = new App();
new MyStack(app, "cdktf-study");
app.synth();
