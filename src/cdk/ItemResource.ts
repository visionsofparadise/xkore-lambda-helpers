import { Construct, Stack } from '@aws-cdk/core';
import { Item as ItemClass } from '../Item';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface ItemResourceProps {
	tags?: Array<string>;
}

export class ItemResource extends Construct implements Documented {
	public Item: typeof ItemClass;

	constructor(scope: Construct, Item: typeof ItemClass, props?: ItemResourceProps) {
		super(scope, (Item.jsonSchema as { title: string }).title!);

		this.Item = Item;

		if (props && props.tags) this.Item.tags = [...this.Item.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'group'>) => {
		const stack = Stack.of(this);

		return [
			new Documentation({
				...props,
				documentationName: (this.Item.jsonSchema as { title: string }).title,
				hiddenKeys: this.Item.hiddenKeys,
				ownerKeys: this.Item.ownerKeys,
				type: 'item',
				jsonSchemas: [
					stack.toJsonString({
						value: this.Item.jsonSchema
					})
				],
				tags: this.Item.tags
			}).data
		];
	};
}
