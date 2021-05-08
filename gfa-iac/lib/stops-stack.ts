import { Construct, NestedStack } from "@aws-cdk/core";
import { IBucket } from '@aws-cdk/aws-s3';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { GfaFunction } from './function/gfa-function';

export interface StopsStackProps {
    api: HttpApi,
}

export class StopsStack extends NestedStack {
    constructor(scope: Construct, id: string, props: StopsStackProps) {
        super(scope, id);

        const getStops = new GfaFunction(this, 'get-stops', {
            name: 'get-stops',
            environment: {
                // TODO: Pass table and index name
            }
        });
        // TODO: Grant access to events table/index

        props.api.addRoutes({
            path: '/stops',
            methods: [ HttpMethod.GET ],
            integration: new LambdaProxyIntegration({
                handler: getStops.handler,
            }),
        });
    }
}
