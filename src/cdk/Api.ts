import { RestApi, Cors } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';
import { DomainBasePathMapping } from './DomainBasePathMapping';

export class Api extends Construct {
	public readonly api: RestApi;
	public readonly root: RestApi['root'];

	constructor(
		scope: Construct,
		id: string,
		props: {
			deploymentName: string;
			stage: string;
			domainName: string;
			basePath: string;
			aliasTarget: string;
			aliasHostedZoneId: string;
		}
	) {
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
		this.root = restApi.root;
	}
}
