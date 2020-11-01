import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { Bucket } from '@aws-cdk/aws-s3';

export class WebStack extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        const webHostingBucket = new Bucket(this, 'gfa-web-bucket', {
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            websiteIndexDocument: 'index.html'
        });

    }
}