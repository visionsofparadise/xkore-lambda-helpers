import { Construct } from '@aws-cdk/core';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { CustomDynamoDBItem, CustomDynamoDBItemProps } from './CustomDynamoDBItem';

export interface HasSchema {
	createSchemaParts: (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => Array<SchemaPart>;
}

export interface SchemaLoaderProps extends Omit<CustomDynamoDBItemProps, 'item'> {
	service: string;
	stage: string;
	schemaGroups: Array<{
		name?: string;
		items: Array<HasSchema>;
	}>;
}

export class SchemaLoader extends Construct {
	public schemaParts: Array<SchemaPart>;
	public customResources: Array<CustomDynamoDBItem>;

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

		const customResources = [];

		for (const schemaPart of schemaParts) {
			const customResource = new CustomDynamoDBItem(this, `${schemaPart.data.id}Item`, {
				...props,
				item: schemaPart.data
			});

			customResources.push(customResource);
		}

		this.customResources = customResources;
	}
}
