import { Construct, Stack } from '@aws-cdk/core';
import { Event } from '../Event';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface EventResourceProps<Detail extends object> {
	Event: Event<Detail>;
	tags?: Array<string>;
}

export class EventResource<Detail extends object> extends Construct implements Documented {
	public Event: Event<Detail>;

	constructor(scope: Construct, props: EventResourceProps<Detail>) {
		super(scope, props.Event.detailType);

		this.Event = props.Event;

		if (props.tags) this.Event.tags = [...this.Event.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);

		const jsonSchemas = [];

		if (this.Event.detailJSONSchema) {
			jsonSchemas.push(
				stack.toJsonString({
					value: this.Event.detailJSONSchema
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
