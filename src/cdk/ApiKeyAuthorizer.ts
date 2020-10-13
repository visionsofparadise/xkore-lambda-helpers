import { CfnAuthorizer, LambdaAuthorizerProps } from '@aws-cdk/aws-apigateway';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Construct, Stack } from '@aws-cdk/core';
import { LambdaAuthorizer } from './LambdaAuthorizer';

export interface TokenAuthorizerProps extends LambdaAuthorizerProps {
	readonly restApiId: string;
	readonly validationRegex?: string;
	readonly identitySource?: string;
}

const lambdaAuthorizerArn = (handler: IFunction) => {
	return `arn:${handler.env.account}:apigateway:${handler.env.region}:lambda:path/2015-03-31/functions/${handler.functionArn}/invocations`;
};

export class ApiKeyAuthorizer extends LambdaAuthorizer {
	public readonly authorizerId: string;
	public readonly authorizerArn: string;

	public readonly authorizer: {
		authorizerId: string;
		authorizerArn: string;
	};

	constructor(scope: Construct, id: string, props: TokenAuthorizerProps) {
		super(scope, id, props);

		const customAuthorizer = new CfnAuthorizer(this, 'customAuthorizer', {
			name: `${props.authorizerName}${this.node.uniqueId}`,
			restApiId: props.restApiId,
			type: 'TOKEN',
			authorizerUri: lambdaAuthorizerArn(props.handler),
			authorizerCredentials: props.assumeRole && props.assumeRole.roleArn,
			authorizerResultTtlInSeconds: props.resultsCacheTtl && props.resultsCacheTtl.toSeconds(),
			identitySource: props.identitySource || 'method.request.header.Authorization',
			identityValidationExpression: props.validationRegex
		});

		this.authorizerId = customAuthorizer.ref;
		this.authorizerArn = Stack.of(this).formatArn({
			service: 'execute-api',
			resource: props.restApiId,
			resourceName: `authorizers/${this.authorizerId}`
		});

		this.authorizer = {
			authorizerId: this.authorizerId,
			authorizerArn: this.authorizerArn
		};

		this.setupPermissions();
	}
}
