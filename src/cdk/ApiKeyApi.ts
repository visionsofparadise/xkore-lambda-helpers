import { RestApi } from '@aws-cdk/aws-apigateway';
import { CfnPermission, IFunction } from '@aws-cdk/aws-lambda';
import { Arn, Construct, Stack } from '@aws-cdk/core';
import { Api, ApiProps } from './Api';
import { ApiKeyAuthorizer } from './ApiKeyAuthorizer';

export interface ApiKeyApiProps extends ApiProps {
	readonly stack: Stack;
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

		if (props.stack) {
			new CfnPermission(this, 'authorizerPermission', {
				action: 'lambda:InvokeFunction',
				principal: 'apigateway.amazonaws.com',
				functionName: props.handler.functionArn,
				sourceArn: Arn.format(
					{
						service: 'execute-api',
						resource: this.api.restApiId,
						resourceName: 'authorizers/*'
					},
					props.stack
				)
			});
		}
	}
}
