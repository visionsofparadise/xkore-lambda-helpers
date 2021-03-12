import { Construct } from '@aws-cdk/core';
import { IItem } from '../Item';
import { IDocumentation } from '../Documentation';
import { SeedItems } from './SeedItems';

export interface Documented {
	createDocumentation: (props: Pick<IDocumentation, 'service' | 'group'>) => Array<IItem>;
}

export interface DocumentationItemsProps {
	tableArn: string;
	service: string;
	groups: Array<{
		name?: string;
		items: Array<Documented>;
	}>;
}

export class DocumentationItems extends Construct {
	public documentationItems: Array<IItem>;

	constructor(scope: Construct, id: string, props: DocumentationItemsProps) {
		super(scope, id);

		let documentationItems: Array<IItem> = [];

		for (const group of props.groups) {
			for (const item of group.items) {
				const itemDocumentation = item.createDocumentation({
					service: props.service,
					group: group.name
				});

				documentationItems = [...documentationItems, ...itemDocumentation];
			}
		}

		this.documentationItems = documentationItems;

		new SeedItems(this, 'DocumentationItems', {
			tableArn: props.tableArn,
			items: this.documentationItems
		});
	}
}
