import { Construct } from '@aws-cdk/core';
import { EventGeneric } from '../Event';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { HasSchema } from './Schema';

export interface EventProps {
	Event: EventGeneric;
	tags?: Array<string>;
}

export class Event extends Construct implements HasSchema {
	public Event: EventGeneric;

	constructor(scope: Construct, id: string, props: EventProps) {
		super(scope, id);

		this.Event = props.Event;

		if (props.tags) this.Event.tags = [...this.Event.tags, ...props.tags];
	}

	public createSchemaParts = (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => [
		new SchemaPart({
			...props,
			id: this.node.id,
			schemas: this.Event.detailSchema ? [JSON.stringify(this.Event.detailSchema)] : []
		})
	];
}
