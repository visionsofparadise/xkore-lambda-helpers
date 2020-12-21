import { CfnJson, Construct, NestedStack, NestedStackProps } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { SystemItems, SystemItemsProps } from './SystemItems';

export interface DocumentationNestedStackProps extends NestedStackProps {
	parameters: {
		service: string;
		stage: string;
		json: string;
	} & Omit<SystemItemsProps, 'items' | 'physicalResourceId'>;
}

export type JSONBlobKeys = 'jsonBlob0' | 'jsonBlob1' | 'jsonBlob2' | 'jsonBlob3' | 'jsonBlob4';

export class DocumentationNestedStack extends NestedStack {
	constructor(scope: Construct, id: string, props: DocumentationNestedStackProps) {
		super(scope, id, props);

		const { json, service, stage, tableName, tableArn } = props.parameters;

		const documentationItemsData = JSON.parse(json) as Array<IDocumentation>;

		new SystemItems(this, 'DocumentationItems', {
			physicalResourceId: [service, stage, 'documentation-items'].join('-'),
			tableArn: tableArn,
			tableName: tableName,
			items: documentationItemsData
		});
	}
}

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

		const jsonBlob = (new CfnJson(this, 'JsonBlob', {
			value: JSON.stringify(documentationItemsData)
		}) as unknown) as string;

		let documentationStackParameters: DocumentationNestedStackProps = {
			parameters: {
				tableName: props.tableName,
				tableArn: props.tableArn,
				service: props.service,
				stage: props.stage,
				json: jsonBlob
			}
		};

		new DocumentationNestedStack(this, 'DocumentationStack', documentationStackParameters);
	}
}
