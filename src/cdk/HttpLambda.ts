import { Construct } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { HttpLambdaHandlerGeneric } from '../HttpLambdaHandler';
import { IResource, LambdaIntegration, MethodOptions } from '@aws-cdk/aws-apigateway';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { HasSchema } from './SchemaLoader';

export interface HttpLambdaProps extends FunctionProps {
	HttpLambdaHandler: HttpLambdaHandlerGeneric;
	integrations: Array<{
		resource: IResource;
		options: MethodOptions;
	}>;
	tags?: Array<string>;
}

export class HttpLambda extends Function implements HasSchema {
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

	public createSchemaParts = (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => {
		const schemaParts = [];

		for (const integration of this.integrations) {
			const schemasAndUndefined = [
				this.HttpLambdaHandler.paramSchema,
				this.HttpLambdaHandler.bodySchema,
				this.HttpLambdaHandler.querySchema,
				this.HttpLambdaHandler.responseSchema
			];
			const schemas = schemasAndUndefined.filter(schema => schema !== undefined);
			const JSONSchemas = schemas.map(schema => JSON.stringify(schema));

			schemaParts.push(
				new SchemaPart({
					...props,
					id: this.node.id,
					schemas: JSONSchemas,
					method: this.HttpLambdaHandler.method,
					path: integration.resource.path
				})
			);
		}

		return schemaParts;
	};
}
