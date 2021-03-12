import AWS from 'aws-sdk';
import kuuid from 'kuuid';
import { dbClient } from '../dbClient';
import { TestItem } from './TestItem';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

it('validates item', async () => {
	const testData = new TestItem({ testAttribute: kuuid.id() });

	const result = await testData.validate();

	expect(result).toBe(true);
});

it('throws on invalid item', async () => {
	expect.assertions(1);

	const testData = new TestItem({ testAttribute: (123 as unknown) as string });

	try {
		await testData.validate();
	} catch (err) {
		expect(err).toBeDefined();
	}
});

it('creates item', async () => {
	const testData = await new TestItem({ testAttribute: kuuid.id() }).create();

	const getData = await db.get({
		Key: testData.pk
	});

	expect(getData).toStrictEqual(testData.data);
	expect(testData.data.itemType).toBe('TestItem');
});

it('saves data to item', async () => {
	const testData = new TestItem({ testAttribute: kuuid.id() });

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

it('save fails if item doesnt exist', async () => {
	await new TestItem({ testAttribute: kuuid.id() }).save().catch(err => expect(err).toBeDefined());
});

it('deletes item', async () => {
	const testData = new TestItem({ testAttribute: kuuid.id() });

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
