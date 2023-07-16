import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: "for-ecs-on-fargate-example",
      maxAzs: 2,
      natGateways: 1,
    });

    // ECR リポジトリ
    const repository = this.ecrRepository();

    // ECS
    this.ecs({ vpc, repository });
  }

  private ecrRepository() {
    return new ecr.Repository(this, "Repository", {
      repositoryName: "ecs-on-fargate-example",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });
  }

  private ecs(props: { vpc: ec2.Vpc; repository: ecr.Repository }) {
    // ECS クラスター
    const ecsCluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
    });

    // ECS タスク定義
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDef",
    );

    // コンテナ
    const container = fargateTaskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "latest"),
      memoryLimitMiB: 256,
    });

    container.addPortMappings({
      containerPort: 3000,
    });

    // ECS サービス
    const service = new ecs.FargateService(this, "Service", {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinition,
      assignPublicIp: true,
      desiredCount: 1,
    });

    service.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    // オートスケーリング設定
    const scaling = service.autoScaleTaskCount({
      minCapacity: 0,
      maxCapacity: 2,
    });
    // By CPU Utilization
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 90,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
    // By Memory Utilization
    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 90,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}
