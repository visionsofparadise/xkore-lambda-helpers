import { JSONSchemaType } from 'ajv';
import { EventBridge } from 'aws-sdk';
import { logger } from './helpers/logger';

export class Event<Detail extends object> {
	public tags: Array<string>;
	public readonly source: string;
	public readonly detailType: string;
	public readonly detailJSONSchema: JSONSchemaType<Detail>;
	protected readonly _eventbridge: EventBridge;

	constructor(params: {
		source: string;
		tags?: Array<string>;
		detailType: string;
		detailJSONSchema: JSONSchemaType<Detail>;
		eventbridge: EventBridge;
	}) {
		(this.tags = params.tags || []),
			(this.source = params.source),
			(this.detailType = params.detailType),
			(this.detailJSONSchema = params.detailJSONSchema),
			(this._eventbridge = params.eventbridge);
	}

	public send = async (detail: Detail | Array<Detail>) => {
		const entries = Array.isArray(detail)
			? detail.map(d => ({
					Source: this.source,
					DetailType: this.detailType,
					Detail: JSON.stringify(d)
			  }))
			: [
					{
						Source: this.source,
						DetailType: this.detailType,
						Detail: JSON.stringify(detail)
					}
			  ];

		logger.info({ entries });

		const result = await this._eventbridge
			.putEvents({
				Entries: entries
			})
			.promise();

		logger.info({ result });

		return result;
	};
}
