import { RestApi, Cors, MethodOptions } from '@aws-cdk/aws-apigateway';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { ApiKeyAuthorizer } from './ApiKeyAuthorizer';
import { CognitoAuthorizer } from './CognitoAuthorizer';
import { createOutput } from './createOutput';
import { DomainBasePathMapping } from './DomainBasePathMapping';

export class Api extends Construct {
	public readonly apiUrl: CfnOutput;
	public readonly restApi: RestApi;
	public readonly authorizer?: Construct & Pick<MethodOptions, 'authorizationType' | 'authorizer'>;

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
			cognitoAuthorizer?: { userPoolArn: string };
			apiKeyAuthorizer?: { functionArn: string };
		}
	) {
		super(scope, id);

		const restApi = new RestApi(this, 'restApi', {
			restApiName: props.deploymentName + '-api',
			description: props.deploymentName,
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS
			}
		});

		this.restApi = restApi;

		if (props.cognitoAuthorizer) {
			const cognitoAuthorizer = new CognitoAuthorizer(this, 'cognitoAuthorizer', {
				name: props.deploymentName + '-cognitoAuthorizer',
				restApiId: restApi.restApiId,
				providerArns: [props.cognitoAuthorizer.userPoolArn]
			});

			this.authorizer = cognitoAuthorizer;
		}

		if (props.apiKeyAuthorizer) {
			const apiKeyAuthorizer = new ApiKeyAuthorizer(this, 'apiKeyAuthorizer', {
				functionArn: props.apiKeyAuthorizer.functionArn
			});

			this.authorizer = apiKeyAuthorizer;
		}

		if (props.stage === 'prod') {
			new DomainBasePathMapping(this, 'basePathMapping', {
				domainName: props.domainName,
				basePath: props.basePath,
				domainNameAliasTarget: props.aliasTarget,
				domainNameAliasHostedZoneId: props.aliasHostedZoneId,
				restApi
			});
		}

		this.apiUrl = createOutput(this, props.deploymentName, 'apiUrl', restApi.url);
	}
}
