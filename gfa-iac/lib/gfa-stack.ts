import { App, Stack, StackProps } from '@aws-cdk/core';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { Bucket } from '@aws-cdk/aws-s3';
import { IngestionStack } from './gfa-ingestion-stack';
import { ApiStack } from './gfa-api-stack';
import { WebStack } from './gfa-web-stack';

interface GbgFarligtAvfallStackProps extends StackProps {
  artifactsBucketName: string,
  version: string,
}

export class GbgFarligtAvfallStack extends Stack {

  constructor(app: App, id: string, props: GbgFarligtAvfallStackProps) {
    super(app, id, props);

    const artifactsBucket = Bucket.fromBucketName(this, 'artifactsBucket', props.artifactsBucketName);

    const eventsDb = new Table(this, 'gfa-events-db', {
      partitionKey: { name: 'event-date', type: AttributeType.STRING },
      sortKey: { name: 'location-id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    const stopsS3Path = 'stops.json';
    const stopsBucket = new Bucket(this, 'gfa-stops-bucket');

    const ingestionStack = new IngestionStack(this, 'gfa-ingestion-stack', {
      version: props.version,
      artifactsBucket: artifactsBucket,
      stopsBucket: stopsBucket,
      stopsPath: stopsS3Path
    });

    const apiStack = new ApiStack(this, 'gfa-api-stack', {
      version: props.version,
      artifactsBucket: artifactsBucket,
      stopsBucket: stopsBucket,
      stopsPath: stopsS3Path,
    });

    const webStack = new WebStack(this, 'gfa-web-stack');
  }
}
