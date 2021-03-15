import { IItem, RequiredKeys, Item } from '../Item';
import AWS from 'aws-sdk';
import kuuid from 'kuuid';
import { jsonObjectSchemaGenerator } from '../jsonObjectSchemaGenerator';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface ITestItem extends IItem {
	testAttribute: string;
}

const jsonSchema = jsonObjectSchemaGenerator<ITestItem>({
	title: 'TestItem',
	description: 'Test item',
	properties: {
		...Item.itemSchema.properties!,
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
				pk: params.pk || kuuid.id(),
				sk: params.sk || TestItem.jsonSchema.title!,
				itemType: params.itemType || TestItem.jsonSchema.title!
			},
			TestItem
		);
	}
}
