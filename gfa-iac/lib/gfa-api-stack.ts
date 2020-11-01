import { NestedStack, NestedStackProps } from '@aws-cdk/aws-cloudformation';
import { IBucket } from '@aws-cdk/aws-s3';
import { Construct } from '@aws-cdk/core';
import { Cors, LambdaRestApi } from '@aws-cdk/aws-apigateway';
import { functionCreator } from './function-creator';

interface ApiStackProps extends NestedStackProps {
    version: string,
    artifactsBucket: IBucket,
    stopsBucket: IBucket,
    stopsPath: string,
}

export class ApiStack extends NestedStack {

    public readonly api: LambdaRestApi;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const newFunction = functionCreator(props.artifactsBucket, props.version);
        const getStops = newFunction(this, 'get-stops', {
            environment: {
                STOPS_BUCKET: props.stopsBucket.bucketName,
                STOPS_PATH: props.stopsPath,
            }
        });
        props.stopsBucket.grantRead(getStops, props.stopsPath);

        this.api = new LambdaRestApi(this, 'gfa-api', {
            handler: getStops,
            proxy: false,
        });
    
        const resource = this.api.root.addResource('stops');
        resource.addMethod('GET');
        resource.addCorsPreflight({
            allowOrigins: Cors.ALL_ORIGINS,
        })
    }
}