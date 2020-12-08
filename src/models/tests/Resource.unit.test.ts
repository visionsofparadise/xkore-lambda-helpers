import { BaseResource, Resource } from '../Resource';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { InferType, object, string } from 'yup';
import { dbClient } from '../../util/dbClient';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

const validationSchema = object({
	testAttribute: string().required()
});

class TestResource extends Resource<InferType<typeof validationSchema>> {
	public static resourceType = 'TestResource';

	constructor(params: Omit<TestResource['initial'], keyof BaseResource>) {
		super({
			attributes: {
				pk: nanoid(),
				sk: 'TestResource',
				resourceType: TestResource.resourceType,
				...params
			},

			config: {
				db,
				validationSchema: object({
					testAttribute: string().required()
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
	expect(testData.data.resourceType).toBe('TestResource');
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
