import { logger } from './logger';
import { JSONSchemaType } from 'ajv';
import { EventBridgeEvent } from 'aws-lambda';

export type EventLambdaHandlerGeneric = EventLambdaHandler<string, object>;

export class EventLambdaHandler<
	DetailType extends string,
	Detail extends object,
	DetailSchema = JSONSchemaType<Detail>
> {
	protected _handlerFn: (e: EventBridgeEvent<DetailType, Detail>) => void | Promise<void>;

	public detailType: Array<DetailType>;
	public detailSchema?: DetailSchema;
	public tags: Array<string>;

	constructor(
		config: {
			detailType: Array<DetailType>;
			detailSchema?: DetailSchema;
			tags?: Array<string>;
		},
		handler: (e: EventBridgeEvent<DetailType, Detail>) => void | Promise<void>
	) {
		this.detailType = config.detailType;
		this.detailSchema = config.detailSchema;
		this.tags = config.tags || [];
		this._handlerFn = handler;
	}

	public handler = async (event: EventBridgeEvent<DetailType, Detail>) => {
		logger.info({ event });

		try {
			await this._handlerFn(event);

			return;
		} catch (error) {
			logger.error({ error });

			throw error;
		}
	};
}
