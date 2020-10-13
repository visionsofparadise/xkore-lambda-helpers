import { BaseResource, Resource } from '../Resource';
import * as yup from 'yup';
import { dbClient } from '../../util/dbClient';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

interface Attributes {
	testAttribute: string;
}

class TestResource extends Resource<Attributes> {
	constructor(params: Partial<Attributes & BaseResource> & Attributes) {
		super({
			pk: params.testAttribute,
			sk: params.testAttribute,
			resourceType: 'Test',
			...params,

			config: {
				db,
				validationSchema: yup.object({
					testAttribute: yup.string().required()
				}),

				hiddenKeys: ['testAttribute'],
				ownerKeys: []
			}
		});
	}
}

it('creates resource', async () => {
	const testData = await new TestResource({ testAttribute: nanoid() }).create();

	const getData = await db.get({
		Key: testData.pk
	});

	expect(getData).toStrictEqual(testData.data);
});

it('saves data to resource', async () => {
	const testData = new TestResource({ testAttribute: nanoid() });

	await documentClient
		.put({
			TableName: 'test',
			Item: testData.data
		})
		.promise();

	testData.set({
		testAttribute: 'updated'
	});

	await testData.save();

	const getData = await db.get<typeof testData.data>({
		Key: testData.pk
	});

	expect(getData.testAttribute).toBe('updated');
});

it('save fails if resource doesnt exist', async () => {
	await new TestResource({ testAttribute: nanoid() }).save().catch(err => expect(err).toBeDefined());
});

it('deletes resource', async () => {
	const testData = new TestResource({ testAttribute: nanoid() });

	await documentClient
		.put({
			TableName: 'test',
			Item: testData.data
		})
		.promise();

	await testData.delete();

	await db
		.get({
			Key: testData.pk
		})
		.catch(err => expect(err).toBeDefined());
});
