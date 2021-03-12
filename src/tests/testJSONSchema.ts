import { JSONSchemaType } from 'ajv';

export const testJSONSchema: JSONSchemaType<{ testAttribute: string }> = {
	title: 'test',
	description: 'test',
	type: 'object',
	properties: {
		testAttribute: { type: 'string' }
	},
	required: ['testAttribute']
};
