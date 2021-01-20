import { RestApi } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';
import { Api, ApiProps } from './Api';
import { CognitoAuthorizer } from './CognitoAuthorizer';

export interface CognitoApiProps extends ApiProps {
	readonly userPoolArn: string;
}

export class CognitoApi extends Api {
	public readonly cognitoApi: RestApi;
	public readonly cognitoApiURLPaths: Api['url'];
	public readonly cognitoAuthorizer: CognitoAuthorizer;

	constructor(scope: Construct, id: string, props: CognitoApiProps) {
		super(scope, id, props);

		this.cognitoAuthorizer = new CognitoAuthorizer(this, 'cognitoAuthorizer', {
			restApiId: this.api.restApiId,
			providerArn: props.userPoolArn
		});

		this.cognitoApi = this.api;
		this.cognitoApiURLPaths = this.url;
	}
}
