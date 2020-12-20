import { Construct } from '@aws-cdk/core';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { CustomDynamoDBItems, CustomDynamoDBItemsProps } from './CustomDynamoDBItems';

export interface HasSchema {
	createSchemaParts: (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => Array<SchemaPart>;
}

export interface SchemaLoaderProps extends Omit<CustomDynamoDBItemsProps, 'items'> {
	service: string;
	stage: string;
	schemaGroups: Array<{
		name?: string;
		items: Array<HasSchema>;
	}>;
}

export class SchemaLoader extends Construct {
	public schemaParts: Array<SchemaPart>;
	public customResource: CustomDynamoDBItems;

	constructor(scope: Construct, id: string, props: SchemaLoaderProps) {
		super(scope, id);

		let schemaParts: Array<SchemaPart> = [];

		for (const group of props.schemaGroups) {
			for (const item of group.items) {
				const parts = item.createSchemaParts({
					service: props.service,
					stage: props.stage,
					group: group.name
				});

				schemaParts = [...schemaParts, ...parts];
			}
		}

		this.schemaParts = schemaParts;

		const customResource = new CustomDynamoDBItems(this, 'SchemaPartsItems', {
			...props,
			items: schemaParts.map(schemaPart => schemaPart.data)
		});

		this.customResource = customResource;
	}
}
