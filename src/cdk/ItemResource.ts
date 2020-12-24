import { Construct, Stack } from '@aws-cdk/core';
import { Item } from '../Item';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface ItemResourceProps {
	Item: typeof Item;
	tags?: Array<string>;
}

export class ItemResource extends Construct implements Documented {
	public Item: typeof Item;

	constructor(scope: Construct, id: string, props: ItemResourceProps) {
		super(scope, id);

		this.Item = props.Item;

		if (props.tags) this.Item.tags = [...this.Item.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);

		return [
			new Documentation({
				...props,
				id: (this.Item.jsonSchema as { title: string }).title,
				type: 'item',
				jsonSchemas: [
					stack.toJsonString({
						value: this.Item.jsonSchema
					})
				]
			})
		];
	};
}
