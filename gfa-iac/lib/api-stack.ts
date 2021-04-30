import { NestedStack } from '@aws-cdk/aws-cloudformation';
import { Construct } from '@aws-cdk/core';
import { HttpApi, CorsHttpMethod, DomainName } from '@aws-cdk/aws-apigatewayv2';
import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { CertificateValidation } from '@aws-cdk/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ApiGatewayv2DomainProperties } from '@aws-cdk/aws-route53-targets';

export class ApiStack extends NestedStack {

    public readonly api: HttpApi;
    public readonly externalUrl?: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const hostedZoneId = scope.node.tryGetContext('hostedZoneId');
        const domainName = scope.node.tryGetContext('domainName');
        const apiDomainName = `gfa-api.${domainName}`;

        const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'e-hostedzone', {
            hostedZoneId: hostedZoneId,
            zoneName: domainName,
        });
        const apiCert = new Certificate(this, 'api-certificate', {
            domainName: apiDomainName,
            validation: CertificateValidation.fromDns(hostedZone),
        });
        const customDomainName = new DomainName(this, 'domain-name', {
            domainName: apiDomainName,
            certificate: apiCert,
        });
        this.api = new HttpApi(this, 'apiv2', {
            corsPreflight: {
                allowHeaders: ['Content-Type', 'Accept'],
                allowOrigins: ['*'],
                allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.PUT, CorsHttpMethod.POST],
            },
            defaultDomainMapping: {
                domainName: customDomainName,
            }
        });
        new ARecord(this, 'api-domain-record', {
            zone: hostedZone,
            recordName: apiDomainName,
            target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(
                customDomainName.regionalDomainName,
                customDomainName.regionalHostedZoneId,
            )),
        });
    }
}
