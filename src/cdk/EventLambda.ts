import { Construct } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { EventLambdaHandlerGeneric } from '../EventLambdaHandler';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { IDocumentation, Documentation } from '../Documentation';
import { Rule } from '@aws-cdk/aws-events';
import { Documented } from './DocumentationItems';

export interface EventLambdaProps extends FunctionProps {
	EventLambdaHandler: EventLambdaHandlerGeneric;
	source: string;
	tags?: Array<string>;
}

export class EventLambda extends Function implements Documented {
	public EventLambdaHandler: EventLambdaHandlerGeneric;

	constructor(scope: Construct, id: string, props: EventLambdaProps) {
		super(scope, id, props);

		this.EventLambdaHandler = props.EventLambdaHandler;

		if (props.tags) this.EventLambdaHandler.tags = [...this.EventLambdaHandler.tags, ...props.tags];

		new Rule(this, 'onCasheyeOrderPaidRule', {
			eventPattern: {
				source: [props.source],
				detailType: this.EventLambdaHandler.detailType
			},
			targets: [new LambdaFunction(this)]
		});
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => [
		new Documentation({
			...props,
			id: this.node.id,
			type: 'event',
			jsonSchemas: this.EventLambdaHandler.detailJSONSchema
				? [{ schemaName: 'event-detail', schemaJSON: JSON.stringify(this.EventLambdaHandler.detailJSONSchema) }]
				: []
		})
	];
}
