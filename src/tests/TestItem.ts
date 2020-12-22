import { IItem, RequiredKeys, Item } from '../Item';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { JSONSchemaType } from 'ajv';
import { jsonObjectSchemaGenerator } from '../jsonObjectSchemaGenerator';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface ITestItem extends IItem {
	testAttribute: string;
}

const jsonSchema: JSONSchemaType<ITestItem> = jsonObjectSchemaGenerator({
	title: 'TestItem',
	description: 'Test resource',
	properties: {
		...Item.resourceSchema.properties!,
		testAttribute: { type: 'string' }
	}
});

export class TestItem extends Item<ITestItem> {
	public static documentClient = documentClient;
	public static tableName = 'test';
	public static jsonSchema = jsonSchema;
	public static hiddenKeys = [];
	public static ownerKeys = [];

	constructor(params: RequiredKeys<ITestItem, 'testAttribute'>) {
		super(
			{
				...params,
				pk: params.pk || nanoid(),
				sk: params.sk || TestItem.jsonSchema.title!,
				resourceType: params.resourceType || TestItem.jsonSchema.title!
			},
			TestItem
		);
	}
}
