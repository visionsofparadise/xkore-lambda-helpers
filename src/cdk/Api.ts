import { RestApi, Cors } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';
import { DomainBasePathMapping } from './DomainBasePathMapping';

export interface ApiProps {
	readonly deploymentName: string;
	readonly stage: string;
	readonly domainName: string;
	readonly basePath: string;
	readonly aliasTarget: string;
	readonly aliasHostedZoneId: string;
}

export class Api extends Construct {
	public readonly api: RestApi;

	constructor(scope: Construct, id: string, props: ApiProps) {
		super(scope, id);

		const restApi = new RestApi(this, 'restApi', {
			restApiName: `${props.deploymentName}-${id}`,
			description: props.deploymentName,
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS
			}
		});

		if (props.stage === 'prod') {
			new DomainBasePathMapping(this, 'basePathMapping', {
				domainName: props.domainName,
				basePath: props.basePath,
				domainNameAliasTarget: props.aliasTarget,
				domainNameAliasHostedZoneId: props.aliasHostedZoneId,
				restApi
			});
		}

		this.api = restApi;
	}
}
