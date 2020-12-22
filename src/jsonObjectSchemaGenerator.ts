import { JSONSchemaType } from 'ajv';
import { RequiredKeys } from './Item';

export const jsonObjectSchemaGenerator = <Data extends object>(
	schema: RequiredKeys<JSONSchemaType<Data>, 'title' | 'properties'>
): JSONSchemaType<Data> => {
	const jsonSchema = ({
		title: schema.title,
		description: schema.description,
		type: schema.type || 'object',
		properties: schema.properties,
		required: schema.required,
		additionalProperties: false
	} as unknown) as JSONSchemaType<Data>;

	return jsonSchema;
};
