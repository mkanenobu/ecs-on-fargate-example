import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDef",
    );

    const repository = new ecr.Repository(this, "Repository", {
      repositoryName: "ecs-on-fargate-example",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    const container = fargateTaskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromEcrRepository(repository),
    });
  }
}
