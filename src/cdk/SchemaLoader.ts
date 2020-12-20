import { ISchemaPart, SchemaPart } from '../SchemaPart';

export interface HasSchema {
	createSchemaParts: (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => Array<SchemaPart>;
}

export interface SchemaLoaderProps {
	service: string;
	stage: string;
	schemaGroups: Array<{
		name?: string;
		items: Array<HasSchema>;
	}>;
}

export class SchemaLoader {
	public schemaParts: Array<SchemaPart>;
	public itemsJSON: string;

	constructor(props: SchemaLoaderProps) {
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
		this.itemsJSON = JSON.stringify(schemaParts.map(schemaPart => schemaPart.data));
	}
}
