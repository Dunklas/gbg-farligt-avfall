import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { App, Stack, StackProps } from '@aws-cdk/core';
      
export class GbgFarligtAvfallStack extends Stack {
  public readonly lambdaCode: lambda.CfnParametersCode;
      
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);
      
    const gfaEvents = new dynamodb.Table(this, 'gfa-events', {
      partitionKey: { name: 'event-date', type: dynamodb.AttributeType.STRING }
    });

    this.lambdaCode = lambda.Code.fromCfnParameters();
    const gfaPoller = new lambda.Function(this, 'gfa-poller', {
      code: this.lambdaCode,
      handler: 'doesnt.matter',
      runtime: lambda.Runtime.PROVIDED,
      environment: {
        EVENTS_TABLE: gfaEvents.tableName,
      }
    });

  }
}
