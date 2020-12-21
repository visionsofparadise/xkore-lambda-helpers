import { Construct, NestedStack, NestedStackProps } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { SystemItems, SystemItemsProps } from './SystemItems';

export interface DocumentationNestedStackProps extends NestedStackProps {
	parameters: {
		service: string;
		stage: string;
		jsonBlob0: string;
		jsonBlob1: string;
		jsonBlob2: string;
		jsonBlob3: string;
		jsonBlob4: string;
	} & Omit<SystemItemsProps, 'items' | 'physicalResourceId'>;
}

export type JSONBlobKeys = 'jsonBlob0' | 'jsonBlob1' | 'jsonBlob2' | 'jsonBlob3' | 'jsonBlob4';

export class DocumentationNestedStack extends NestedStack {
	constructor(scope: Construct, id: string, props: DocumentationNestedStackProps) {
		super(scope, id, props);

		const {
			jsonBlob0,
			jsonBlob1,
			jsonBlob2,
			jsonBlob3,
			jsonBlob4,
			service,
			stage,
			tableName,
			tableArn
		} = props.parameters;

		const jsonBlobs = [jsonBlob0, jsonBlob1, jsonBlob2, jsonBlob3, jsonBlob4];

		const json = jsonBlobs.join('');
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
				const parts = item.createDocumentation({
					service: props.service,
					stage: props.stage,
					group: group.name
				});

				documentationItems = [...documentationItems, ...parts];
			}
		}

		this.documentationItems = documentationItems;
		const documentationItemsData = documentationItems.map(documentation => documentation.data);

		const jsonBlob = JSON.stringify(documentationItemsData);
		const interval = 4000;

		for (let i = 0; i < jsonBlob.length; i + interval) {
			const sizeLeft = jsonBlob.length - i;
			const size = sizeLeft < interval ? sizeLeft : interval;

			this.json.push(jsonBlob.slice(i, i + size));
		}

		let documentationStackParameters: DocumentationNestedStackProps = {
			parameters: {
				tableName: props.tableName,
				tableArn: props.tableArn,
				service: props.service,
				stage: props.stage,
				jsonBlob0: this.json[0] || '',
				jsonBlob1: this.json[1] || '',
				jsonBlob2: this.json[2] || '',
				jsonBlob3: this.json[3] || '',
				jsonBlob4: this.json[4] || ''
			}
		};

		new DocumentationNestedStack(this, 'DocumentationStack', documentationStackParameters);
	}
}
