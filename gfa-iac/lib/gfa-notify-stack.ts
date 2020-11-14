import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { Construct } from '@aws-cdk/core';
import { IBucket } from '@aws-cdk/aws-s3';
import { functionCreator } from './function-creator';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { Topic } from '@aws-cdk/aws-sns';

interface NotifyStackProps extends NestedStackProps {
    version: string,
    artifactsBucket: IBucket,
    eventsTable: ITable,
}

export class NotifyStack extends NestedStack {
    constructor(scope: Construct, id: string, props: NotifyStackProps) {
        super(scope, id, props);

        const arrivalToday = new Topic(this, 'gfa-today-topic');

        const newFunction = functionCreator(props.artifactsBucket, props.version);
        const notify = newFunction(this, 'notify', {
            environment: {
                EVENTS_TABLE: props.eventsTable.tableName,
                TODAY_TOPIC: arrivalToday.topicArn,
            }
        });
        props.eventsTable.grantReadData(notify);
        arrivalToday.grantPublish(notify);

    }
}