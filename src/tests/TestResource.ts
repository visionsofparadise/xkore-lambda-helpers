import { IResource, RequiredKeys, Resource } from '../Resource';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { JSONSchemaType } from 'ajv';
import { jsonObjectSchemaGenerator } from '../jsonObjectSchemaGenerator';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface ITestResource extends IResource {
	testAttribute: string;
}

const schema: JSONSchemaType<ITestResource> = jsonObjectSchemaGenerator({
	$id: 'TestResource',
	description: 'Test resource',
	properties: {
		...Resource.resourceSchema.properties!,
		testAttribute: { type: 'string' }
	}
});

export class TestResource extends Resource<ITestResource> {
	public static documentClient = documentClient;
	public static tableName = 'test';
	public static schema = schema;
	public static hiddenKeys = [];
	public static ownerKeys = [];

	constructor(params: RequiredKeys<ITestResource, 'testAttribute'>) {
		super(
			{
				...params,
				pk: params.pk || nanoid(),
				sk: params.sk || 'TestResource',
				resourceType: params.resourceType || TestResource.schema.$id!
			},
			TestResource
		);
	}
}
