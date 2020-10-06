import { CfnAuthorizer, CfnAuthorizerProps } from '@aws-cdk/aws-apigateway/lib/apigateway.generated';
import { AuthorizationType, MethodOptions } from '@aws-cdk/aws-apigateway/lib/method';
import { Construct } from '@aws-cdk/core/lib/construct-compat';

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
