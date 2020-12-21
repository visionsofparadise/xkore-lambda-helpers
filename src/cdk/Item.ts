import { Construct } from '@aws-cdk/core';
import { Item as ItemModel } from '../Item';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface ItemProps {
	Item: typeof ItemModel;
	tags?: Array<string>;
}

export class Item extends Construct implements Documented {
	public Item: typeof ItemModel;

	constructor(scope: Construct, id: string, props: ItemProps) {
		super(scope, id);

		this.Item = props.Item;

		if (props.tags) this.Item.tags = [...this.Item.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => [
		new Documentation({
			...props,
			id: this.node.id,
			type: 'item',
			jsonSchemas: [{ schemaName: 'item', schemaJSON: JSON.stringify(this.Item.jsonSchema) }]
		})
	];
}