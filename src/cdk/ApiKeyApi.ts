import { Function } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { Api, ApiProps } from './Api';
import { ApiKeyAuthorizer } from './ApiKeyAuthorizer';

export interface ApiKeyApiProps extends ApiProps {
	readonly functionArn: string;
}

export class ApiKeyApi extends Api {
	public readonly apiKeyAuthorizer: ApiKeyAuthorizer;

	constructor(scope: Construct, id: string, props: ApiKeyApiProps) {
		super(scope, id, props);

		const handler = Function.fromFunctionArn(this, 'apiKeyAuthorizerImportedHandler', props.functionArn);

		this.apiKeyAuthorizer = new ApiKeyAuthorizer(this, 'apiKeyAuthorizer', {
			restApiId: this.api.restApiId,
			handler
		});
	}
}
