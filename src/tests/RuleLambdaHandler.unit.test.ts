import { EventBridgeEvent } from 'aws-lambda';
import { RuleLambdaHandler } from '../RuleLambdaHandler';
import { testJSONSchema } from './testJSONSchema';

const createTestHandler = (handler: (e: any) => any) =>
	new RuleLambdaHandler(
		{
			detailType: ['test'],
			detailJSONSchema: testJSONSchema
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
