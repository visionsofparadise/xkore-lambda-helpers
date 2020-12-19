import { JSONSchemaType } from 'ajv';
import { EventBridge } from 'aws-sdk';
import { logger } from './logger';

export type EventGeneric = Event<any>;

export class Event<Detail extends object> {
	public tags: Array<string>;
	public readonly source: string;
	public readonly detailType: string;
	public readonly detailSchema: JSONSchemaType<Detail>;
	protected readonly _eventbridge: EventBridge;

	constructor(params: {
		source: string;
		tags?: Array<string>;
		detailType: string;
		detailSchema: JSONSchemaType<Detail>;
		eventbridge: EventBridge;
	}) {
		(this.tags = params.tags || []),
			(this.source = params.source),
			(this.detailType = params.detailType),
			(this.detailSchema = params.detailSchema),
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

		this._eventbridge
			.putEvents({
				Entries: entries
			})
			.promise();
	};
}
