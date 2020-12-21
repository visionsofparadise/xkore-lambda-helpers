import AWS from 'aws-sdk';
import { dbClient } from '../dbClient';
import { Documentation } from '../Documentation';
import { testJSONSchema } from './testJSONSchema';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

const testDocumentation = () =>
	new Documentation({
		id: 'test',
		type: 'item',
		service: 'test',
		stage: 'test',
		jsonSchemas: [{ schemaName: 'test', schemaJSON: JSON.stringify(testJSONSchema) }]
	});

it('creates and gets new documentation', async () => {
	const documentation = await testDocumentation().create();

	const getDocumentation = await Documentation.get(documentation.pk, db);

	expect(getDocumentation.data).toStrictEqual(documentation.data);

	await documentation.delete();
});

it('lists documentation', async () => {
	await testDocumentation().create();

	const documentation = await Documentation.list({ stage: 'test' }, db);

	expect(documentation.length).toBe(1);
});
