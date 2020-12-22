import { JSONSchemaType } from 'ajv';
import { jsonObjectSchemaGenerator } from '../jsonObjectSchemaGenerator';

export const testJSONSchema: JSONSchemaType<{ testAttribute: string }> = jsonObjectSchemaGenerator({
	title: 'test',
	description: 'test',
	properties: {
		testAttribute: { type: 'string' }
	}
});
