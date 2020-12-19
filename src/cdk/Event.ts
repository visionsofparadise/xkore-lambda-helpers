import { Construct } from '@aws-cdk/core';
import { Event as EventClass } from '../Event';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { HasSchema } from './Schema';

export interface EventProps<Detail extends object> {
	Event: EventClass<Detail>;
	tags?: Array<string>;
}

export class Event<Detail extends object> extends Construct implements HasSchema {
	public Event: EventClass<Detail>;

	constructor(scope: Construct, id: string, props: EventProps<Detail>) {
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
