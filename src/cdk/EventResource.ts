import { Construct, Stack } from '@aws-cdk/core';
import { Event } from '../Event';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface EventResourceProps {
	tags?: Array<string>;
}

export class EventResource<Detail extends object> extends Construct implements Documented {
	public Event: Event<Detail>;

	constructor(scope: Construct, Event: Event<Detail>, props?: EventResourceProps) {
		super(scope, Event.detailType);

		this.Event = Event;

		if (props && props.tags) this.Event.tags = [...this.Event.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'group'>) => {
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
				documentationName: this.node.id,
				type: 'event',
				detailType: this.Event.detailType,
				jsonSchemas,
				tags: this.Event.tags
			})
		];
	};
}
