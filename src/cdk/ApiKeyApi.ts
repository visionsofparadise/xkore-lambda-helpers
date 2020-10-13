import { RestApi } from '@aws-cdk/aws-apigateway';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { Api, ApiProps } from './Api';
import { ApiKeyAuthorizer } from './ApiKeyAuthorizer';

export interface ApiKeyApiProps extends ApiProps {
	readonly handler: IFunction;
}

export class ApiKeyApi extends Api {
	public readonly apiKeyApi: RestApi;
	public readonly apiKeyAuthorizer: ApiKeyAuthorizer;

	constructor(scope: Construct, id: string, props: ApiKeyApiProps) {
		super(scope, id, props);

		this.apiKeyAuthorizer = new ApiKeyAuthorizer(this, 'apiKeyAuthorizer', {
			restApiId: this.api.restApiId,
			handler: props.handler
		});

		this.apiKeyApi = this.api;
	}
}
