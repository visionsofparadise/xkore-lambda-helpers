import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { dbClient } from '../dbClient';
import { TestResource } from './TestResource';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

it('validates resource', async () => {
	const testData = new TestResource({ testAttribute: nanoid() });

	const result = testData.validate();

	expect(result).toBe(true);
});

it('throws on invalid resource', async () => {
	expect.assertions(1);

	const testData = new TestResource({ testAttribute: (123 as unknown) as string });

	try {
		testData.validate();
	} catch (err) {
		expect(err).toBeDefined();
	}
});

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
