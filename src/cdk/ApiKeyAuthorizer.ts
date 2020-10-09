import { MethodOptions, AuthorizationType, TokenAuthorizer } from '@aws-cdk/aws-apigateway';
import { Function } from '@aws-cdk/aws-lambda';
import { Construct, Duration } from '@aws-cdk/core';

export class ApiKeyAuthorizer extends Construct {
	public readonly methodOptions: Pick<MethodOptions, 'authorizationType' | 'authorizer'>;

	constructor(scope: Construct, id: string, props: { functionArn: string; cacheTtl?: number }) {
		super(scope, id);

		const apiKeyAuthorizerHandler = Function.fromFunctionArn(this, 'apiKeyAuthorizer', props.functionArn);

		const apiKeyAuthorizer = new TokenAuthorizer(this, 'apiKeyAuthorizer', {
			handler: apiKeyAuthorizerHandler,
			resultsCacheTtl: Duration.minutes(props.cacheTtl || 5)
		});

		this.methodOptions = {
			authorizationType: AuthorizationType.CUSTOM,
			authorizer: apiKeyAuthorizer
		};
	}
}
