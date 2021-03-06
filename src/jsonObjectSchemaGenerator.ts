import { JSONSchemaType } from 'ajv';
import { RequiredKeys } from './Item';

export type JSONObjectSchemaType<Data extends object> = JSONSchemaType<Data>;

export const jsonObjectSchemaGenerator = <Data extends object>(
	schema: RequiredKeys<JSONSchemaType<Data>, 'properties'>
): JSONSchemaType<Data> => {
	const keys = Object.keys(schema.properties!);
	const requiredKeys = keys.filter(key => {
		const property = schema.properties![key] as { nullable?: boolean };

		return !property.nullable;
	});

	const jsonSchema = ({
		additionalProperties: true,
		...schema,
		type: schema.type || 'object',
		properties: schema.properties,
		required: requiredKeys
	} as unknown) as JSONSchemaType<Data>;

	return jsonSchema;
};
