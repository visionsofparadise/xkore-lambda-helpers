import { Authorizer, IAuthorizer, LambdaAuthorizerProps, IRestApi } from '@aws-cdk/aws-apigateway';
import { IRole, ServicePrincipal, Role, Policy, PolicyStatement } from '@aws-cdk/aws-iam';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Construct, Lazy } from '@aws-cdk/core';

export abstract class LambdaAuthorizer extends Authorizer implements IAuthorizer {
	public abstract readonly authorizerId: string;
	public abstract readonly authorizerArn: string;
	protected readonly handler: IFunction;
	protected readonly role?: IRole;
	protected restApiId?: string;

	protected constructor(scope: Construct, id: string, props: LambdaAuthorizerProps) {
		super(scope, id);

		this.handler = props.handler;
		this.role = props.assumeRole;

		if (props.resultsCacheTtl && props.resultsCacheTtl?.toSeconds() > 3600) {
			throw new Error("Lambda authorizer property 'resultsCacheTtl' must not be greater than 3600 seconds (1 hour)");
		}
	}

	public _attachToApi(restApi: IRestApi) {
		if (this.restApiId && this.restApiId !== restApi.restApiId) {
			throw new Error('Cannot attach authorizer to two different rest APIs');
		}

		this.restApiId = restApi.restApiId;
	}

	protected setupPermissions() {
		if (!this.role) {
			this.handler.addPermission(`${this.node.addr}:Permissions`, {
				principal: new ServicePrincipal('apigateway.amazonaws.com'),
				sourceArn: this.authorizerArn
			});
		} else if (this.role instanceof Role) {
			this.role.attachInlinePolicy(
				new Policy(this, 'authorizerInvokePolicy', {
					statements: [
						new PolicyStatement({
							resources: [this.handler.functionArn],
							actions: ['lambda:InvokeFunction']
						})
					]
				})
			);
		}
	}

	protected lazyRestApiId() {
		return Lazy.stringValue({
			produce: () => {
				if (!this.restApiId) {
					throw new Error(`Authorizer (${this.node.path}) must be attached to a RestApi`);
				}
				return this.restApiId;
			}
		});
	}
}
