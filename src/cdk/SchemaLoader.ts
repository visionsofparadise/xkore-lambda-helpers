import { Construct } from '@aws-cdk/core';
import { masterOutput } from './createOutput';
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

export class SchemaLoader extends Construct {
	public schemaParts: Array<SchemaPart>;
	public json: Array<string> = [];
	public jsonParts: number = 0;

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

		const json = JSON.stringify(schemaParts.map(schemaPart => schemaPart.data));

		for (let i = 0; i < json.length; i + 1000) {
			this.json.push(json.slice(i, i + 1000));
			this.jsonParts = this.jsonParts + 1;
		}

		const createOutput = masterOutput(this, `${props.service}-${props.stage}`);

		for (let i = 0; i < this.json.length; i++) {
			createOutput(`schemaJSONData-${i}`, this.json[i]);
		}

		createOutput(`schemaJSONParts`, this.jsonParts.toString());
	}
}
