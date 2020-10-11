import { RestApi, Cors } from '@aws-cdk/aws-apigateway';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { ApiKeyAuthorizer } from './ApiKeyAuthorizer';
import { CognitoAuthorizer } from './CognitoAuthorizer';
import { createOutput } from './createOutput';
import { DomainBasePathMapping } from './DomainBasePathMapping';

export class Api<Cognito extends string | undefined, ApiKey extends string | undefined> extends Construct {
	public readonly apiUrl: CfnOutput;
	public readonly restApi: RestApi;
	public readonly cognitoAuthorizer!: Cognito extends string ? CognitoAuthorizer : undefined;
	public readonly apiKeyAuthorizer!: ApiKey extends string ? ApiKeyAuthorizer : undefined;

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
			cognitoUserPoolArn: Cognito;
			apiKeyFunctionArn: ApiKey;
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

		this.restApi = restApi;

		if (props.cognitoUserPoolArn == 'string') {
			const cognitoAuthorizer = new CognitoAuthorizer(this, 'cognitoAuthorizer', {
				name: props.deploymentName + '-cognitoAuthorizer',
				restApiId: restApi.restApiId,
				providerArns: [props.cognitoUserPoolArn as string]
			});

			this.cognitoAuthorizer = cognitoAuthorizer as Cognito extends string ? CognitoAuthorizer : undefined;
		}

		if (props.apiKeyFunctionArn) {
			const apiKeyAuthorizer = new ApiKeyAuthorizer(this, 'apiKeyAuthorizer', {
				functionArn: props.apiKeyFunctionArn as string
			});

			this.apiKeyAuthorizer = apiKeyAuthorizer as ApiKey extends string ? ApiKeyAuthorizer : undefined;
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
