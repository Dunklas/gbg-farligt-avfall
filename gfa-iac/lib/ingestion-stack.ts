import { Construct, Duration } from '@aws-cdk/core';
import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { StateMachine, TaskInput } from '@aws-cdk/aws-stepfunctions';
import { SnsPublish } from '@aws-cdk/aws-stepfunctions-tasks';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { ITopic } from '@aws-cdk/aws-sns';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { SfnStateMachine } from '@aws-cdk/aws-events-targets';
import { GfaFunctionWithInvokeTask } from './function/gfa-function-invoke';

export interface IngestionStackProps extends NestedStackProps {
  eventsTable: ITable,
  alertTopic: ITopic, 
}

export class IngestionStack extends NestedStack {

  constructor(scope: Construct, id: string, props: IngestionStackProps) {
    super(scope, id, props);

    const scraper = new GfaFunctionWithInvokeTask(this, 'scraper', {
      name: 'scraper',
      outputPath: '$.Payload'
    });

    const saveEvents = new GfaFunctionWithInvokeTask(this, 'save-events', {
      name: 'save-events',
      environment: {
        EVENTS_TABLE: props.eventsTable.tableName
      }
    });
    props.eventsTable.grantWriteData(saveEvents.handler);

    const alertTask = new SnsPublish(this, 'Data ingestion alert', {
            topic: props.alertTopic,
            message: TaskInput.fromDataAt('$.Cause'),
            subject: 'GFA: Data ingestion alert'
    });
    const scrapeAndSaveFlow = new StateMachine(this, 'scrape-and-save', {
      definition: scraper.task.addCatch(alertTask)
        .next(saveEvents.task.addCatch(alertTask)),
      timeout: Duration.minutes(5)
    });

    new Rule(this, 'scrape-and-save-scheduled-execution', {
      schedule: Schedule.expression('cron(0 0 1 * ? *)'),
      targets: [new SfnStateMachine(scrapeAndSaveFlow)],
    });
  }
}
