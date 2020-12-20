import { Construct } from '@aws-cdk/core';
import { Resource as ResourceModel } from '../Resource';
import { ISchemaPart, SchemaPart } from '../SchemaPart';
import { HasSchema } from './SchemaLoader';

export interface ResourceProps {
	Resource: typeof ResourceModel;
	tags?: Array<string>;
}

export class Resource extends Construct implements HasSchema {
	public Resource: typeof ResourceModel;

	constructor(scope: Construct, id: string, props: ResourceProps) {
		super(scope, id);

		this.Resource = props.Resource;

		if (props.tags) this.Resource.tags = [...this.Resource.tags, ...props.tags];
	}

	public createSchemaParts = (props: Pick<ISchemaPart, 'service' | 'stage' | 'group'>) => [
		new SchemaPart({
			...props,
			id: this.node.id,
			schemas: [JSON.stringify(this.Resource.schema)]
		})
	];
}
