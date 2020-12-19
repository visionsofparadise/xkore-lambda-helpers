import AWS from 'aws-sdk';
import { dbClient } from '../dbClient';
import { SchemaPart } from '../SchemaPart';
import { testSchema } from './testSchema';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const db = dbClient(documentClient, 'test');

const testSchemaPart = () =>
	new SchemaPart({
		id: 'test',
		schemas: [JSON.stringify(testSchema)],
		service: 'test',
		stage: 'test'
	});

it('creates and gets new schemaPart', async () => {
	const schemaPart = await testSchemaPart().create();

	const getSchemaPart = await SchemaPart.get(schemaPart.pk, db);

	expect(getSchemaPart.data).toStrictEqual(schemaPart.data);

	await schemaPart.delete();
});

it('lists schemaParts', async () => {
	await testSchemaPart().create();

	const schemaParts = await SchemaPart.list({ stage: 'test' }, db);

	expect(schemaParts.length).toBe(1);
});
