import { MethodOptions, CfnAuthorizer, CfnAuthorizerProps, AuthorizationType } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';

export class CognitoAuthorizer extends Construct {
	public readonly methodOptions: Pick<MethodOptions, 'authorizationType' | 'authorizer'>;

	constructor(
		scope: Construct,
		id: string,
		props: Pick<CfnAuthorizerProps, 'name' | 'restApiId' | 'providerArns'> & Partial<CfnAuthorizerProps>
	) {
		super(scope, id);

		const cognitoAuthorizer = new CfnAuthorizer(this, 'userPoolAuthorizer', {
			name: props.name,
			restApiId: props.restApiId,
			type: AuthorizationType.COGNITO,
			identitySource: 'method.request.header.Authorization',
			providerArns: props.providerArns
		});

		this.methodOptions = {
			authorizationType: AuthorizationType.COGNITO,
			authorizer: {
				authorizerId: cognitoAuthorizer.ref
			}
		};
	}
}
