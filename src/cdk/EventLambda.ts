import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { EventLambdaHandler } from '../EventLambdaHandler';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { IDocumentation, Documentation } from '../Documentation';
import { Rule } from '@aws-cdk/aws-events';
import { Documented } from './DocumentationItems';
import { JSONSchemaType } from 'ajv';

export interface EventLambdaProps<
	DetailType extends string,
	Detail extends object,
	DetailJSONSchema = JSONSchemaType<Detail>
> extends FunctionProps {
	EventLambdaHandler: EventLambdaHandler<DetailType, Detail, DetailJSONSchema>;
	source: string;
	tags?: Array<string>;
}

export class EventLambda<DetailType extends string, Detail extends object, DetailJSONSchema = JSONSchemaType<Detail>>
	extends Function
	implements Documented {
	public EventLambdaHandler: EventLambdaHandler<DetailType, Detail, DetailJSONSchema>;

	constructor(scope: Construct, id: string, props: EventLambdaProps<DetailType, Detail, DetailJSONSchema>) {
		super(scope, id, props);

		this.EventLambdaHandler = props.EventLambdaHandler;

		if (props.tags) this.EventLambdaHandler.tags = [...this.EventLambdaHandler.tags, ...props.tags];

		new Rule(this, `${id}Rule`, {
			eventPattern: {
				source: [props.source],
				detailType: this.EventLambdaHandler.detailType
			},
			targets: [new LambdaFunction(this)]
		});
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);

		const jsonSchemas = [];

		if (this.EventLambdaHandler.detailJSONSchema) {
			jsonSchemas.push(
				stack.toJsonString({
					value: this.EventLambdaHandler.detailJSONSchema
				})
			);
		}

		return [
			new Documentation({
				...props,
				id: this.node.id,
				type: 'event',
				jsonSchemas
			})
		];
	};
}
