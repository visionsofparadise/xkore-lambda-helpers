import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { HttpLambdaHandlerGeneric } from '../HttpLambdaHandler';
import { IResource, LambdaIntegration, MethodOptions } from '@aws-cdk/aws-apigateway';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface HttpLambdaProps extends FunctionProps {
	HttpLambdaHandler: HttpLambdaHandlerGeneric;
	integrations: Array<{
		resource: IResource;
		options: MethodOptions;
	}>;
	tags?: Array<string>;
}

export class HttpLambda extends Function implements Documented {
	public HttpLambdaHandler: HttpLambdaHandlerGeneric;
	public integrations: Array<{
		resource: IResource;
		options: MethodOptions;
	}>;

	constructor(scope: Construct, id: string, props: HttpLambdaProps) {
		super(scope, id, props);

		this.HttpLambdaHandler = props.HttpLambdaHandler;
		this.integrations = props.integrations;

		if (props.tags) this.HttpLambdaHandler.tags = [...this.HttpLambdaHandler.tags, ...props.tags];

		for (const integration of props.integrations) {
			integration.resource.addMethod(props.HttpLambdaHandler.method, new LambdaIntegration(this), integration.options);
		}
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);
		const documentation = [];

		const jsonSchemas = [
			{
				schemaName: 'params',
				schemaJSON: stack.toJsonString({
					value: this.HttpLambdaHandler.paramsJSONSchema
				})
			},
			{
				schemaName: 'body',
				schemaJSON: stack.toJsonString({
					value: this.HttpLambdaHandler.bodyJSONSchema
				})
			},
			{
				schemaName: 'query',
				schemaJSON: stack.toJsonString({
					value: this.HttpLambdaHandler.queryJSONSchema
				})
			},
			{
				schemaName: 'response',
				schemaJSON: stack.toJsonString({
					value: this.HttpLambdaHandler.responseJSONSchema
				})
			}
		];

		for (const integration of this.integrations) {
			documentation.push(
				new Documentation({
					...props,
					id: this.node.id,
					type: 'endpoint',
					jsonSchemas,
					method: this.HttpLambdaHandler.method,
					path: integration.resource.path
				})
			);
		}

		return documentation;
	};
}
