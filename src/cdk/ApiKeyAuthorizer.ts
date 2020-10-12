import { TokenAuthorizer } from '@aws-cdk/aws-apigateway';
import { Function } from '@aws-cdk/aws-lambda';
import { Construct, Duration } from '@aws-cdk/core';

export class ApiKeyAuthorizer extends Construct {
	public readonly authorizer: {
		authorizerId: TokenAuthorizer['authorizerId'];
		authorizationType: TokenAuthorizer['authorizationType'];
	};

	constructor(scope: Construct, id: string, props: { functionArn: string; cacheTtl?: number }) {
		super(scope, id);

		const apiKeyAuthorizerHandler = Function.fromFunctionArn(
			this,
			'apiKeyAuthorizerFunctionFromArn',
			props.functionArn
		);

		const apiKeyAuthorizer = new TokenAuthorizer(this, 'tokenAuthorizer', {
			handler: apiKeyAuthorizerHandler,
			resultsCacheTtl: Duration.minutes(props.cacheTtl || 5)
		});

		this.authorizer = {
			authorizerId: apiKeyAuthorizer.authorizerId,
			authorizationType: apiKeyAuthorizer.authorizationType
		};
	}
}
