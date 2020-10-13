import { APIGatewayProxyEvent } from 'aws-lambda';
import { response as httpResponse, BAD_REQUEST_400 } from '../response';
import { lambdaWrap } from '../lambdaWrap';

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
	const handler = lambdaWrap<{ userId: string; body: {} }>({ cognitoAuth: true }, async e => {
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
	const handler = lambdaWrap<{ userId: string; body: {} }>({ customAuth: true }, async e => {
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
