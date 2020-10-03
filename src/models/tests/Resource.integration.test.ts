import { Resource } from '../Resource';
import * as yup from 'yup';
import { BaseResource } from '../../types/Resource';
import AWS from 'aws-sdk';
import { dbClient } from '../../util/dbClient';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export const testEventBridge = ({
	putEvents: (_: any) => ({
		promise: () => 'success'
	})
} as unknown) as AWS.EventBridge;

export const testDB = dbClient(
	new DocumentClient({
		endpoint: 'http://localhost:8000'
	}),
	'x-lambda-helpers-db-local'
);

interface Attributes {
	name: string;
}

class TestResource extends Resource<Attributes> {
	constructor(params: Partial<Attributes & BaseResource> & Attributes) {
		super({
			pk: params.name,
			sk: params.name,
			resourceType: 'Test',
			...params,

			config: {
				db: testDB,
				eventbridge: testEventBridge,

				validationSchema: yup.object({
					name: yup.string().required()
				}),

				hiddenKeys: ['name'],
				ownerKeys: []
			}
		});
	}

	static test = true;
}

it('saves resource, updates, update errors, then deletes', async () => {
	const testData = await new TestResource({ name: 'test' }).create();

	testData.set({ name: 'updated' });
	await testData.save();
	expect(testData.data.name).toBe('updated');

	testData.set({ name: (123 as unknown) as string });
	await testData.save().catch(error => expect(error.statusCode).toBe(400));

	await testData.delete();

	return;
});
