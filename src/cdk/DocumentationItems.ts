import { Construct } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { SeedItems } from './SeedItems';

export interface Documented {
	createDocumentation: (props: Pick<IDocumentation, 'service' | 'group'>) => Array<Documentation>;
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
	public documentationItems: Array<Documentation>;

	constructor(scope: Construct, id: string, props: DocumentationItemsProps) {
		super(scope, id);

		let documentationItems: Array<Documentation> = [];

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
		const documentationItemsData = documentationItems.map(documentation => documentation.data);

		new SeedItems(this, 'DocumentationItems', {
			tableArn: props.tableArn,
			items: documentationItemsData
		});
	}
}
