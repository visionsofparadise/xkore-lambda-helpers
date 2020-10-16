import { APIGatewayProxyEvent } from 'aws-lambda';
import { response as httpResponse, BAD_REQUEST_400 } from '../response';
import { lambdaWrap } from '../lambdaWrap';
import * as yup from 'yup';

it('throws internal server error', async () => {
	const handler = lambdaWrap({}, async () => {
		throw new Error();
	});

	await handler({} as APIGatewayProxyEvent).catch(error => expect(error).toBeDefined());

	return;
});

it('returns client error', async () => {
	const handler = lambdaWrap({}, async () => {
		throw httpResponse(BAD_REQUEST_400('test'));
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(400);

	return;
});

it('returns success', async () => {
	const handler = lambdaWrap({}, async () => {
		return 'success';
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(200);

	return;
});

it('returns success (no content)', async () => {
	const handler = lambdaWrap({}, async () => {
		return;
	});

	const response = await handler({} as APIGatewayProxyEvent);
	expect(response.statusCode).toBe(204);

	return;
});

it('gets cognito username', async () => {
	const handler = lambdaWrap({ auth: true }, async e => {
		return e.userId;
	});

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
	const handler = lambdaWrap({ auth: true }, async e => {
		return e.userId;
	});

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
	const handler = lambdaWrap(
		{
			validationSchema: yup.object({
				body: yup.object({
					testAttribute: yup.string().required()
				}),
				params: yup.object({
					testAttribute: yup.string().required()
				}),
				query: yup.object({
					testAttribute: yup.string().required()
				})
			})
		},
		async e => {
			return e;
		}
	);

	const response = await handler(({
		body: JSON.stringify({
			testAttribute: 'test'
		}),
		pathParameters: {
			testAttribute: 'test'
		},
		queryStringParameters: {
			testAttribute: 'test'
		}
	} as unknown) as APIGatewayProxyEvent);

	const data = JSON.parse(response.body);

	expect(data.body.testAttribute).toBe('test');
	expect(data.params.testAttribute).toBe('test');
	expect(data.query.testAttribute).toBe('test');

	return;
});

it('throws on invalidation', async () => {
	const handler = lambdaWrap(
		{
			validationSchema: yup.object({
				body: yup.object({
					testAttribute: yup.string().required()
				}),
				params: yup.object({
					testAttribute: yup.string().required()
				}),
				query: yup.object({
					testAttribute: yup.string().required()
				})
			})
		},
		async e => {
			return e;
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
