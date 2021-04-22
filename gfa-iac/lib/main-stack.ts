import { App, CfnOutput, Stack, StackProps } from '@aws-cdk/core';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { Bucket } from '@aws-cdk/aws-s3';
import { Topic } from '@aws-cdk/aws-sns';
import { EmailSubscription} from '@aws-cdk/aws-sns-subscriptions';
import { IngestionStack } from './ingestion-stack';
import { ApiStack } from './api-stack';
import { WebStack } from './web-stack';
import { NotifyStack } from './notify-stack';
import { SendGridDomainVerifier } from './sendgrid/domain-verifier';
import { SubscriptionStack } from './subscriptions-stack';
import { StopsStack } from './stops-stack';

export class GbgFarligtAvfallStack extends Stack {

  constructor(app: App, id: string) {
    super(app, id);

    const eventsDb = new Table(this, 'events-db', {
      partitionKey: { name: 'event_date', type: AttributeType.STRING },
      sortKey: { name: 'location_id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const stopsS3Path = 'stops.json';
    const stopsBucket = new Bucket(this, 'stops-bucket');

    const alertTopic = new Topic(this, 'admin-alert');
    const adminEmail = app.node.tryGetContext('adminEmail');
    if (adminEmail) {
      alertTopic.addSubscription(new EmailSubscription(adminEmail));
    }

    new IngestionStack(this, 'ingestion-stack', {
      stopsBucket: stopsBucket,
      stopsPath: stopsS3Path,
      eventsTable: eventsDb,
      alertTopic,
    });

    new NotifyStack(this, 'notify-stack', {
      eventsTable: eventsDb,
      alertTopic,
    });

    const webStack = new WebStack(this, 'web-stack');
    const apiStack = new ApiStack(this, 'api-stack');

    const sendgridApiKey = app.node.tryGetContext('sendgridApiKey');
    const hostedZoneId = app.node.tryGetContext('hostedZoneId');
    const domainName = app.node.tryGetContext('domainName');
    new SendGridDomainVerifier(this, 'sendgrid-verifier', {
      hostedZoneId,
      domainName,
      apiKey: sendgridApiKey,
    });

    const stopsStack = new StopsStack(this, 'stops-stack', {
      api: apiStack.api,
      stopsBucket: stopsBucket,
      stopsPath: stopsS3Path
    })

    const subscriptionStack = new SubscriptionStack(this, 'subscription-stack', {
      api: apiStack.api
    });

    new CfnOutput(this, 'WebBucket', {
      value: webStack.webHostingBucketName,
    });
    new CfnOutput(this, 'ApiUrl', {
      value: apiStack.externalUrl || apiStack.api.url,
    });
    new CfnOutput(this, 'WebUrl', {
      value: webStack.webUrl,
    });
    new CfnOutput(this, 'WebDistributionId', {
      value: webStack.webDistributionId,
    })
  }
}
