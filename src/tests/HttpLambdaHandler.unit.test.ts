import { APIGatewayProxyEvent } from 'aws-lambda';
import { Response, BAD_REQUEST_400 } from '../response';
import { HttpLambdaHandler } from '../HttpLambdaHandler';
import { testJSONSchema } from './testJSONSchema';

const createTestHandler = (handler: (e: any) => any, props?: any) =>
	new HttpLambdaHandler(
		{
			method: 'GET',
			...props
		},
		handler
	).handler;

it('throws internal server error', async () => {
	const handler = createTestHandler(async () => {
		throw new Error();
	});

	await handler({} as APIGatewayProxyEvent).catch(error => expect(error).toBeDefined());

	return;
});

it('returns client error', async () => {
	const handler = createTestHandler(async () => {
		throw new Response(BAD_REQUEST_400('test'));
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(400);

	return;
});

it('returns success', async () => {
	const handler = createTestHandler(async () => {
		return 'success';
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(200);

	return;
});

it('returns success (no content)', async () => {
	const handler = createTestHandler(async () => {
		return;
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(204);

	return;
});

it('gets cognito username', async () => {
	const handler = createTestHandler(
		async e => {
			return e.userId;
		},
		{ authorizer: true }
	);

	const response = await handler(({
		requestContext: {
			authorizer: {
				claims: {
					sub: 'test'
				}
			}
		}
	} as unknown) as APIGatewayProxyEvent);
	expect(response.body).toBe('test');

	return;
});

it('gets principalId', async () => {
	const handler = createTestHandler(
		async e => {
			return e.userId;
		},
		{ authorizer: true }
	);

	const response = await handler(({
		requestContext: {
			authorizer: {
				principalId: 'test'
			}
		}
	} as unknown) as APIGatewayProxyEvent);
	expect(response.body).toBe('test');

	return;
});

it('validates and infers type correctly', async () => {
	const handler = createTestHandler(
		async e => {
			return e;
		},
		{
			paramSchema: testJSONSchema,
			bodySchema: testJSONSchema,
			querySchema: testJSONSchema
		}
	);

	const response = await handler(({
		pathParameters: {
			testAttribute: 'test'
		},
		body: JSON.stringify({
			testAttribute: 'test'
		}),
		queryStringParameters: {
			testAttribute: 'test'
		}
	} as unknown) as APIGatewayProxyEvent);

	const data = JSON.parse(response.body);

	console.log({ response });

	expect(data.params.testAttribute).toBe('test');
	expect(data.body.testAttribute).toBe('test');
	expect(data.query.testAttribute).toBe('test');

	return;
});

it('throws on invalidation', async () => {
	const handler = createTestHandler(
		async e => {
			return e;
		},
		{
			paramSchema: testJSONSchema,
			bodySchema: testJSONSchema,
			querySchema: testJSONSchema
		}
	);

	await handler(({
		body: JSON.stringify({
			testAttribute: 'test'
		}),
		pathParameters: {
			testAttribute: 'test'
		},
		queryStringParameters: {
			testAttribute: 123
		}
	} as unknown) as APIGatewayProxyEvent).catch(err => expect(err).toBeDefined());

	return;
});
