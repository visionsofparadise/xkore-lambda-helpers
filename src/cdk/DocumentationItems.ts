import { Construct } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { SystemItems, SystemItemsProps } from './SystemItems';

export interface Documented {
	createDocumentation: (props: Pick<IDocumentation, 'service' | 'stage' | 'group'>) => Array<Documentation>;
}

export interface DocumentationItemsProps extends Omit<SystemItemsProps, 'physicalResourceId' | 'items'> {
	service: string;
	stage: string;
	groups: Array<{
		name?: string;
		items: Array<Documented>;
	}>;
}

export class DocumentationItems extends Construct {
	public documentationItems: Array<Documentation>;
	public json: Array<string> = [];

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
			physicalResourceId: [props.service, props.stage, 'documentationItems'].join('-'),
			tableArn: props.tableArn,
			tableName: props.tableName,
			items: documentationItemsData
		});
	}
}
