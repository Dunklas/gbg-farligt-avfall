import { Construct, RemovalPolicy, Duration } from '@aws-cdk/core';
import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { BlockPublicAccess, Bucket } from '@aws-cdk/aws-s3';
import { CloudFrontAllowedCachedMethods, CloudFrontAllowedMethods, CloudFrontWebDistribution, HttpVersion, OriginAccessIdentity, PriceClass } from '@aws-cdk/aws-cloudfront';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

interface WebStackProps extends NestedStackProps {
    hostedZoneId?: string,
    domainName?: string,
}

export class WebStack extends NestedStack {

    public readonly webUrl: string;
    public readonly webDistributionId: string;
    public readonly webHostingBucketName: string;

    constructor(scope: Construct, id: string, props: WebStackProps = {}) {
        super(scope, id, props);

        const webHostingBucket = new Bucket(this, 'gfa-web-bucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            websiteIndexDocument: 'index.html',
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });
        this.webHostingBucketName = webHostingBucket.bucketName;
        
        const accessIdentity = new OriginAccessIdentity(this, 'gfa-web-access-identity');
        webHostingBucket.grantRead(accessIdentity);

        const distribution = new CloudFrontWebDistribution(this, 'gfa-web-dist', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: webHostingBucket,
                        originAccessIdentity: accessIdentity,
                    },
                    behaviors: [{
                        isDefaultBehavior: true,
                        cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                        allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                        compress: true,
                        defaultTtl: Duration.hours(1),
                        maxTtl: Duration.days(1),
                        minTtl: Duration.minutes(1),
                    }],
                }
            ],
            priceClass: PriceClass.PRICE_CLASS_100,
            httpVersion: HttpVersion.HTTP2,
            defaultRootObject: 'index.html',
            errorConfigurations: [
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 86400
                },
                {
                    errorCode: 404,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 86400
                }
            ] 
        });
        this.webUrl = distribution.distributionDomainName;
        this.webDistributionId = distribution.distributionId;


        if (props.hostedZoneId && props.domainName) {
            const webDomainName = `gfa-web.${props.domainName}`;
            const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'e-hostedzone', {
                hostedZoneId: props.hostedZoneId,
                zoneName: props.domainName,
            });
            new ARecord(this, 'gfa-web-domain-record', {
                zone: hostedZone,
                target: RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
                recordName: webDomainName,
            });

        }
    }
}
