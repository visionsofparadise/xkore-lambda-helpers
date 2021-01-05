import { Construct, Stack } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface ItemResourceProps {
	tags?: Array<string>;
}

interface ItemClass {
	jsonSchema: any;
	tags: Array<string>;
}

export class ItemResource extends Construct implements Documented {
	public Item: ItemClass;

	constructor(scope: Construct, Item: ItemClass, props?: ItemResourceProps) {
		super(scope, (Item.jsonSchema as { title: string }).title!);

		this.Item = Item;

		if (props && props.tags) this.Item.tags = [...this.Item.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => {
		const stack = Stack.of(this);

		return [
			new Documentation({
				...props,
				documentationName: (this.Item.jsonSchema as { title: string }).title,
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
