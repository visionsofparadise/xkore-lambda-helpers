import { AuthorizationType, CfnAuthorizer, CfnAuthorizerProps, TokenAuthorizer } from '@aws-cdk/aws-apigateway';
import { Function, IFunction } from '@aws-cdk/aws-lambda';
import { Construct, Stack } from '@aws-cdk/core';

export class ApiKeyAuthorizer extends Construct {
	public readonly authorizer: {
		authorizerId: TokenAuthorizer['authorizerId'];
		authorizationType: TokenAuthorizer['authorizationType'];
	};

	constructor(
		scope: Construct,
		id: string,
		props: Pick<CfnAuthorizerProps, 'restApiId'> & { functionArn: string; cacheTtl?: number } & Partial<
				CfnAuthorizerProps
			>
	) {
		super(scope, id);

		const lambdaAuthorizerArn = (handler: IFunction) => {
			return `arn:${Stack.of(handler).partition}:apigateway:${
				Stack.of(handler).region
			}:lambda:path/2015-03-31/functions/${handler.functionArn}/invocations`;
		};

		const apiKeyAuthorizerHandler = Function.fromFunctionArn(
			this,
			'apiKeyAuthorizerFunctionFromArn',
			props.functionArn
		);

		const apiKeyAuthorizer = new CfnAuthorizer(this, 'tokenAuthorizer', {
			name: id,
			restApiId: props.restApiId,
			type: 'TOKEN',
			authorizerUri: lambdaAuthorizerArn(apiKeyAuthorizerHandler),
			identitySource: 'method.request.header.Authorization',
			authorizerResultTtlInSeconds: 300
		});

		this.authorizer = {
			authorizerId: apiKeyAuthorizer.ref,
			authorizationType: AuthorizationType.CUSTOM
		};
	}
}
