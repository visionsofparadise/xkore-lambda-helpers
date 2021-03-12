import { Construct } from '@aws-cdk/core';
import { IDocumentation, Documentation } from '../Documentation';
import { Documented } from './DocumentationItems';

export interface SectionResourceProps {
	sectionName: string;
	sectionText: string;
	tags?: Array<string>;
}

export class SectionResource extends Construct implements Documented {
	public sectionName: string;
	public sectionText: string;
	public tags: Array<string> = [];

	constructor(scope: Construct, props: SectionResourceProps) {
		super(scope, props.sectionName);

		this.sectionName = props.sectionName;
		this.sectionText = props.sectionText;

		if (props && props.tags) this.tags = [...this.tags, ...props.tags];
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'group'>) => [
		new Documentation({
			...props,
			documentationName: this.sectionName,
			type: 'item',
			jsonSchemas: [],
			tags: this.tags
		}).data
	];
}
