import { Construct, CustomResource } from "@aws-cdk/core";
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';

export interface SendGridDomainVerifierProps {
    hostedZoneId: string,
    domainName: string,
    apiKey: string,
}

// https://baihuqian.github.io/2020-12-17-lambda-based-cdk-custom-resource-with-input-and-output/
export class SendGridDomainVerifier extends Construct {

    constructor(scope: Construct, id: string, props: SendGridDomainVerifierProps) {
        super(scope, id);

        const domainVerifier = new Function(this, `sendgrid-domain-verifier-lambda`, {
            runtime: Runtime.NODEJS_12_X,
            code: Code.fromAsset('lib/sendgrid'),
            handler: 'domain-verifier-lambda.handler',
        });

        const provider = new Provider(this, 'sendgrid-domain-verifier-provider', {
            onEventHandler: domainVerifier,
        });

        const domain = 'myDomain';
        const customResource = new CustomResource(this, `sendgrid-domain-verifier-${domain}`, {
            serviceToken: provider.serviceToken,
            properties: {
                hostedZoneId: props.hostedZoneId,
                domain: props.domainName
            },
        });
    }
}