import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { IDocumentation, Documentation } from '../Documentation';
import { Rule, RuleProps } from '@aws-cdk/aws-events';
import { Documented } from './DocumentationItems';

export interface EventLambdaProps extends FunctionProps {
	EventLambdaHandler: EventLambda['EventLambdaHandler'];
	source: string;
	tags?: Array<string>;
	eventPattern?: RuleProps['eventPattern'];
}

export class EventLambda extends Function implements Documented {
	public EventLambdaHandler: { tags?: Array<string>; detailType: Array<string>; detailJSONSchema: object };

	constructor(scope: Construct, id: string, props: EventLambdaProps) {
		super(scope, id, props);

		this.EventLambdaHandler = props.EventLambdaHandler;

		if (props.tags) this.EventLambdaHandler.tags = [...this.EventLambdaHandler.tags!, ...props.tags];

		new Rule(this, `${id}Rule`, {
			eventPattern: {
				source: [props.source],
				detailType: this.EventLambdaHandler.detailType,
				...props.eventPattern
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
				documentationName: this.node.id,
				type: 'event',
				jsonSchemas
			})
		];
	};
}
