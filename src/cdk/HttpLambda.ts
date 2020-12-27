import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { IResource, LambdaIntegration, MethodOptions } from '@aws-cdk/aws-apigateway';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface HttpLambdaProps extends FunctionProps {
	HttpLambdaHandler: HttpLambda['HttpLambdaHandler'];
	integrations: HttpLambda['integrations'];
	tags?: Array<string>;
}

export class HttpLambda extends Function implements Documented {
	public HttpLambdaHandler: {
		tags?: Array<string>;
		paramsJSONSchema?: object;
		bodyJSONSchema?: object;
		queryJSONSchema?: object;
		responseJSONSchema?: object;
		method: string;
	};
	public integrations: Array<{
		resource: IResource;
		options: MethodOptions;
	}>;

	constructor(scope: Construct, id: string, props: HttpLambdaProps) {
		super(scope, id, props);

		this.HttpLambdaHandler = props.HttpLambdaHandler;
		this.integrations = props.integrations;

		if (props.tags) this.HttpLambdaHandler.tags = [...this.HttpLambdaHandler.tags!, ...props.tags];

		for (const integration of props.integrations) {
			integration.resource.addMethod(props.HttpLambdaHandler.method, new LambdaIntegration(this), integration.options);
		}
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);
		const documentation = [];

		const jsonSchemas = [];

		const objectSchemas = [
			this.HttpLambdaHandler.paramsJSONSchema,
			this.HttpLambdaHandler.bodyJSONSchema,
			this.HttpLambdaHandler.queryJSONSchema,
			this.HttpLambdaHandler.responseJSONSchema
		];

		for (const schema of objectSchemas) {
			if (schema) {
				jsonSchemas.push(
					stack.toJsonString({
						value: schema
					})
				);
			}
		}

		for (const integration of this.integrations) {
			documentation.push(
				new Documentation({
					...props,
					id: this.node.id,
					type: 'endpoint',
					jsonSchemas,
					authorizationType: integration.options.authorizationType,
					method: this.HttpLambdaHandler.method,
					path: integration.resource.path
				})
			);
		}

		return documentation;
	};
}
