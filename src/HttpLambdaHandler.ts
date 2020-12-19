import { Response, SUCCESS_200, SUCCESS_NO_CONTENT_204 } from './Response';
import { logger } from './logger';
import { APIGatewayEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { JSONSchemaType, ValidateFunction } from 'ajv';
import { ajv } from './ajv';

export type HttpLambdaHandlerGeneric = HttpLambdaHandler<
	object | undefined,
	object | undefined,
	object | undefined,
	object | undefined,
	boolean | undefined
>;

interface HttpLambdaEvent<
	P extends object | undefined,
	B extends object | undefined,
	Q extends object | undefined,
	A extends boolean | undefined
> {
	event: APIGatewayEvent;
	params: P extends object ? P : undefined;
	body: B extends object ? B : undefined;
	query: Q extends object ? Q : undefined;
	userId: A extends true ? string : undefined;
}

export class HttpLambdaHandler<
	Params extends object | undefined,
	Body extends object | undefined,
	Query extends object | undefined,
	Response extends object | undefined,
	Authorizer extends boolean | undefined
> {
	protected _authorizer?: Authorizer;
	protected _cognitoClaim?: string;
	protected _paramValidator?: ValidateFunction<JSONSchemaType<Params>>;
	protected _bodyValidator?: ValidateFunction<JSONSchemaType<Body>>;
	protected _queryValidator?: ValidateFunction<JSONSchemaType<Query>>;
	protected _handlerFn: (e: HttpLambdaEvent<Params, Body, Query, Authorizer>) => any | Promise<any>;

	public paramSchema?: JSONSchemaType<Params>;
	public bodySchema?: JSONSchemaType<Body>;
	public querySchema?: JSONSchemaType<Query>;
	public responseSchema?: JSONSchemaType<Response>;
	public tags: Array<string>;
	public method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';

	constructor(
		config: {
			authorizer?: Authorizer;
			cognitoClaim?: string;
			paramSchema?: JSONSchemaType<Params>;
			bodySchema?: JSONSchemaType<Body>;
			querySchema?: JSONSchemaType<Query>;
			responseSchema?: JSONSchemaType<Response>;
			method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';
			tags?: Array<string>;
		},
		handler: (e: HttpLambdaEvent<Params, Body, Query, Authorizer>) => any | Promise<any>
	) {
		this._authorizer = config.authorizer;
		this._cognitoClaim = config.cognitoClaim;
		this._handlerFn = handler;

		this.paramSchema = config.paramSchema;
		this.bodySchema = config.bodySchema;
		this.querySchema = config.querySchema;
		this.tags = config.tags || [];
		this.method = config.method;

		if (this.paramSchema) this._paramValidator = ajv.compile(this.paramSchema!);
		if (this.bodySchema) this._bodyValidator = ajv.compile(this.bodySchema!);
		if (this.querySchema) this._queryValidator = ajv.compile(this.querySchema!);
	}

	public handler = async (event: APIGatewayEvent) => {
		logger.info({ event });

		try {
			let e = {
				event,
				userId: undefined,
				params: undefined,
				body: undefined,
				query: undefined
			};

			if (this._authorizer)
				e.userId =
					event.requestContext.authorizer!.principalId ||
					event.requestContext.authorizer!.claims[this._cognitoClaim || 'sub'];

			if (this.paramSchema && this._paramValidator) {
				this._paramValidator(event.pathParameters) && Object.assign(e, { params: event.pathParameters });
			}

			if (event.body && this.bodySchema && this._bodyValidator) {
				const body = JSON.parse(event.body);

				this._bodyValidator(body) && Object.assign(e, { body });
			}

			if (this.querySchema && this._queryValidator) {
				this._queryValidator(event.queryStringParameters) && Object.assign(e, { query: event.queryStringParameters });
			}

			logger.info({ e });

			const data = await this._handlerFn(e as HttpLambdaEvent<Params, Body, Query, Authorizer>);

			logger.info(data);

			if (!data) return new Response(SUCCESS_NO_CONTENT_204);
			return new Response(SUCCESS_200(data));
		} catch (error) {
			logger.error({ error });

			return new Response({
				statusCode: error.statusCode || 500,
				body: error
			});
		}
	};
}
