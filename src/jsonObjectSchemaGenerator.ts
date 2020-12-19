import { JSONSchemaType } from 'ajv';
import { RequiredKeys } from './Resource';

export const jsonObjectSchemaGenerator = <Data extends object>(
	schema: RequiredKeys<JSONSchemaType<Data>, '$id' | 'description' | 'properties'>
): JSONSchemaType<Data> => {
	const jsonSchema = ({
		$schema: schema.$schema || 'http://json-schema.org/draft-07/schema#',
		$id: schema.$id,
		title: schema.title || schema.$id,
		description: schema.description,
		type: schema.type || 'object',
		properties: schema.properties,
		required: schema.required,
		additionalProperties: false
	} as unknown) as JSONSchemaType<Data>;

	return jsonSchema;
};
