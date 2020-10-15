import { response, SUCCESS_200, SUCCESS_NO_CONTENT_204 } from './response';
import { logger } from '../logger';
import { APIGatewayEvent } from 'aws-lambda/trigger/api-gateway-proxy';

interface TypeParams {
	params?: object;
	body?: object;
	query?: object;
	userId?: string;
}

interface IConfig {
	cognitoAuth?: boolean;
	cognitoClaim?: string;
	customAuth?: boolean;
	cognitoOrCustomAuth?: boolean;
}

interface IEvent {
	event: APIGatewayEvent;
}

export const lambdaWrap = <Params extends TypeParams>(
	config: IConfig | undefined,
	fn: (e: IEvent & Params) => any
) => async (event: APIGatewayEvent) => {
	logger.log({ event });

	try {
		let e = {
			event,
			params: event.pathParameters,
			body: event.body && JSON.parse(event.body),
			query: event.queryStringParameters,
			userId: undefined
		};

		if (config && config.cognitoAuth) e.userId = event.requestContext.authorizer!.claims[config.cognitoClaim || 'sub'];
		if (config && config.customAuth) e.userId = event.requestContext.authorizer!.principalId;

		if (config && config.cognitoOrCustomAuth)
			e.userId =
				event.requestContext.authorizer!.principalId ||
				event.requestContext.authorizer!.claims[config.cognitoClaim || 'sub'];

		const data = await fn(e as IEvent & Params);

		logger.log(data);

		if (!data) return response(SUCCESS_NO_CONTENT_204);
		return response(SUCCESS_200(data));
	} catch (error) {
		logger.log({ error });

		if (error.statusCode && error.statusCode < 500) return error;

		throw new Error('Internal server error');
	}
};
