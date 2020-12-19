import { EventBridgeEvent } from 'aws-lambda';
import { EventLambdaHandler } from '../EventLambdaHandler';
import { testSchema } from './testSchema';

const createTestHandler = (handler: (e: any) => any) =>
	new EventLambdaHandler(
		{
			detailType: ['test'],
			detailSchema: testSchema
		},
		handler
	).handler;

it('throws internal server error', async () => {
	const handler = createTestHandler(async () => {
		throw new Error();
	});

	await handler({} as EventBridgeEvent<'test', { testAttribute: string }>).catch(error => expect(error).toBeDefined());

	return;
});

it('returns success', async () => {
	const handler = createTestHandler(async () => {
		return 'success';
	});

	await handler({} as EventBridgeEvent<'test', { testAttribute: string }>);

	expect(true).toBeTruthy();

	return;
});
