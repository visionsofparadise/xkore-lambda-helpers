import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { IResource, LambdaIntegration, MethodOptions } from '@aws-cdk/aws-apigateway';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';
import { Api } from './Api';

export interface HttpLambdaProps extends FunctionProps {
	HttpLambdaHandler: HttpLambda['HttpLambdaHandler'];
	urlList: Array<Api['url']>;
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
		options?: MethodOptions;
		tags?: Array<string>;
	}>;
	public urlList: Array<Api['url']>;

	constructor(scope: Construct, id: string, props: HttpLambdaProps) {
		super(scope, id, props);

		this.HttpLambdaHandler = props.HttpLambdaHandler;
		this.integrations = props.integrations;
		this.urlList = props.urlList;

		if (props.tags) this.HttpLambdaHandler.tags = [...this.HttpLambdaHandler.tags!, ...props.tags];

		for (const integration of props.integrations) {
			integration.resource.addMethod(props.HttpLambdaHandler.method, new LambdaIntegration(this), integration.options);
		}
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'group'>) => {
		const stack = Stack.of(this);
		const documentation = [];

		const jsonSchemas = [];

		const objectSchemas = [
			this.HttpLambdaHandler.paramsJSONSchema && { ...this.HttpLambdaHandler.paramsJSONSchema, title: 'Params' },
			this.HttpLambdaHandler.bodyJSONSchema && { ...this.HttpLambdaHandler.bodyJSONSchema, title: 'Body' },
			this.HttpLambdaHandler.queryJSONSchema && { ...this.HttpLambdaHandler.queryJSONSchema, title: 'Query' },
			this.HttpLambdaHandler.responseJSONSchema && { ...this.HttpLambdaHandler.responseJSONSchema, title: 'Response' }
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
			const url = this.urlList.filter(urlObj => urlObj.restApiId === integration.resource.api.restApiId)[0];

			documentation.push(
				new Documentation({
					...props,
					documentationName: this.node.id,
					type: 'endpoint',
					jsonSchemas,
					authorizationType:
						integration.options && integration.options.authorizer
							? integration.options.authorizer.authorizationType || integration.options.authorizer.authorizerId
							: undefined,
					method: this.HttpLambdaHandler.method,
					baseURL: url.baseURL,
					basePath: url.basePath,
					path: integration.resource.path.length > 1 ? integration.resource.path.slice(1) : '',
					tags: integration.tags ? [...this.HttpLambdaHandler.tags!, ...integration.tags!] : this.HttpLambdaHandler.tags
				})
			);
		}

		return documentation;
	};
}
