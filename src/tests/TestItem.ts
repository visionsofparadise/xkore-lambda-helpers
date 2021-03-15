import { IItem, RequiredKeys, Item } from '../Item';
import AWS from 'aws-sdk';
import kuuid from 'kuuid';
import { JSONSchemaType } from 'ajv';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface ITestItem extends IItem {
	testAttribute: string;
}

export const testItemJSONSchema: JSONSchemaType<ITestItem> = {
	title: 'TestItem',
	description: 'Test item',
	type: 'object',
	properties: {
		...Item.itemSchema.properties!,
		testAttribute: { type: 'string' }
	},
	required: ['testAttribute']
};

const hiddenKeys = Item.keys([]);
const ownerKeys = Item.keys([]);

export class TestItem extends Item<ITestItem, typeof hiddenKeys[number], typeof ownerKeys[number]> {
	public static jsonSchema = testItemJSONSchema;
	public static hiddenKeys = hiddenKeys;
	public static ownerKeys = ownerKeys;

	constructor(params: RequiredKeys<ITestItem, 'testAttribute'>) {
		super(
			{
				...params,
				pk: params.pk || kuuid.id(),
				sk: params.sk || testItemJSONSchema.title!,
				itemType: params.itemType || testItemJSONSchema.title!
			},
			{
				documentClient: documentClient,
				tableName: 'test',
				jsonSchema: testItemJSONSchema,
				hiddenKeys: hiddenKeys,
				ownerKeys: ownerKeys
			}
		);
	}
}
