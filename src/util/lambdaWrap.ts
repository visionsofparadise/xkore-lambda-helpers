import { response, SUCCESS_200, SUCCESS_NO_CONTENT_204 } from './response';
import { logger } from '../logger';
import { APIGatewayEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { ObjectSchema } from 'yup';

interface IConfig<T extends boolean | undefined, V extends {} | undefined> {
	auth?: T;
	cognitoClaim?: string;
	validationSchema?: ObjectSchema<V>;
}

interface IEvent<T extends boolean | undefined> {
	event: APIGatewayEvent;
	userId: T extends true ? string : undefined;
}

export const lambdaWrap = <T extends boolean | undefined, V extends {} | undefined>(
	config: IConfig<T, V>,
	fn: (e: IEvent<T> & V) => any
) => async (event: APIGatewayEvent) => {
	logger.log({ event });

	try {
		let e = {
			event,
			userId: undefined
		};

		if (config) {
			if (config.auth)
				e.userId =
					event.requestContext.authorizer!.principalId ||
					event.requestContext.authorizer!.claims[config.cognitoClaim || 'sub'];

			if (config.validationSchema) {
				const data = {
					params: event.pathParameters,
					body: event.body && JSON.parse(event.body),
					query: event.queryStringParameters
				};

				await config.validationSchema.validate(data);

				Object.assign(e, data);
			}
		}

		const data = await fn(e as IEvent<T> & V);

		logger.log(data);

		if (!data) return response(SUCCESS_NO_CONTENT_204);
		return response(SUCCESS_200(data));
	} catch (error) {
		logger.log({ error });

		if (error.statusCode && error.statusCode < 500) return error;

		throw new Error('Internal server error');
	}
};
