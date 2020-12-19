import { Construct } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { EventLambdaHandlerGeneric } from '../EventLambdaHandler';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { Rule } from '@aws-cdk/aws-events';
import { HasSchema } from './Schema';

export interface EventLambdaProps extends FunctionProps {
	EventLambdaHandler: EventLambdaHandlerGeneric;
	source: string;
	tags?: Array<string>;
}

export class EventLambda extends Function implements HasSchema {
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

	public createSchemaParts = (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => [
		new SchemaPart({
			...props,
			id: this.node.id,
			schemas: this.EventLambdaHandler.detailSchema ? [JSON.stringify(this.EventLambdaHandler.detailSchema)] : []
		})
	];
}
