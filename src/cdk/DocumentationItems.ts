import { Construct } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { SystemItems } from './SystemItems';
import { Table } from '@aws-cdk/aws-dynamodb';

export interface Documented {
	createDocumentation: (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => Array<Documentation>;
}

export interface DocumentationItemsProps {
	db: Table;
	service: string;
	stage: string;
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
					stage: props.stage,
					group: group.name
				});

				documentationItems = [...documentationItems, ...itemDocumentation];
			}
		}

		this.documentationItems = documentationItems;
		const documentationItemsData = documentationItems.map(documentation => documentation.data);

		new SystemItems(this, 'DocumentationItems', {
			db: props.db,
			items: documentationItemsData
		});
	}
}
