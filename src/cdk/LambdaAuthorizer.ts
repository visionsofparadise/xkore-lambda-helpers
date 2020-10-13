import { Authorizer, IAuthorizer, LambdaAuthorizerProps, IRestApi } from '@aws-cdk/aws-apigateway';
import { IRole, ServicePrincipal, Role, Policy, PolicyStatement } from '@aws-cdk/aws-iam';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Construct, Lazy } from '@aws-cdk/core';

export abstract class LambdaAuthorizer extends Authorizer implements IAuthorizer {
	/**
	 * The id of the authorizer.
	 * @attribute
	 */
	public abstract readonly authorizerId: string;

	/**
	 * The ARN of the authorizer to be used in permission policies, such as IAM and resource-based grants.
	 */
	public abstract readonly authorizerArn: string;

	/**
	 * The Lambda function handler that this authorizer uses.
	 */
	protected readonly handler: IFunction;

	/**
	 * The IAM role that the API Gateway service assumes while invoking the Lambda function.
	 */
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

	/**
	 * Attaches this authorizer to a specific REST API.
	 * @internal
	 */
	public _attachToApi(restApi: IRestApi) {
		if (this.restApiId && this.restApiId !== restApi.restApiId) {
			throw new Error('Cannot attach authorizer to two different rest APIs');
		}

		this.restApiId = restApi.restApiId;
	}

	/**
	 * Sets up the permissions necessary for the API Gateway service to invoke the Lambda function.
	 */
	protected setupPermissions() {
		if (!this.role) {
			this.handler.addPermission(`${this.node.uniqueId}:Permissions`, {
				principal: new ServicePrincipal('apigateway.amazonaws.com'),
				sourceArn: this.authorizerArn
			});
		} else if (this.role instanceof Role) {
			// i.e. not imported
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

	/**
	 * Returns a token that resolves to the Rest Api Id at the time of synthesis.
	 * Throws an error, during token resolution, if no RestApi is attached to this authorizer.
	 */
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
