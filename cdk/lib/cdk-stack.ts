import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: "for-ecs-on-fargate-example",
      maxAzs: 2,
      natGateways: 1,
    });

    // Load Balancer
    const lb = new elb.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
      http2Enabled: true,
    });

    // ECR リポジトリ
    const repository = this.ecrRepository();

    // ECS
    const ecsResources = this.ecs({ vpc, repository });

    const listener = lb.addListener("Listener", { port: 80 });
    listener.addTargets("Target", {
      port: 80,
      targets: [ecsResources.service],
      protocol: elb.ApplicationProtocol.HTTP,
    });
    listener.connections.allowDefaultPortFromAnyIpv4();
  }

  private ecrRepository() {
    return new ecr.Repository(this, "Repository", {
      repositoryName: "ecs-on-fargate-example",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });
  }

  private ecs(props: { vpc: ec2.Vpc; repository: ecr.Repository }) {
    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: "ecs-on-fargate-example",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });

    // ECS クラスター
    const ecsCluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
    });

    // ECS タスク定義
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDef",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.ARM64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      },
    );

    // コンテナ
    const container = fargateTaskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "latest"),
      cpu: 256,
      memoryLimitMiB: 512,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "ecs-on-fargate-example",
        logGroup,
      }),
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
      maxHealthyPercent: 200,
      minHealthyPercent: 50,
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

    return {
      tasksDefinition: fargateTaskDefinition,
      container,
      service,
      cluster: ecsCluster,
    };
  }
}
