import { CfnAuthorizer, CfnAuthorizerProps, AuthorizationType, TokenAuthorizer } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';

export class CognitoAuthorizer extends Construct {
	public readonly authorizer: {
		authorizerId: TokenAuthorizer['authorizerId'];
		authorizationType: TokenAuthorizer['authorizationType'];
	};

	constructor(
		scope: Construct,
		id: string,
		props: Pick<CfnAuthorizerProps, 'restApiId'> & { providerArn: string } & Partial<CfnAuthorizerProps>
	) {
		super(scope, id);

		const cognitoAuthorizer = new CfnAuthorizer(this, 'userPoolAuthorizer', {
			name: id,
			restApiId: props.restApiId,
			type: AuthorizationType.COGNITO,
			identitySource: 'method.request.header.Authorization',
			providerArns: [props.providerArn]
		});

		this.authorizer = {
			authorizerId: cognitoAuthorizer.ref,
			authorizationType: AuthorizationType.COGNITO
		};
	}
}
