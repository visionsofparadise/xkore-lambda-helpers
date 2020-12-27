import { EventBridge } from 'aws-sdk';
import { logger } from './logger';

export const createPutEvents = (eventbridge: EventBridge, source: string) => async (
	events: Array<{ detailType: string; detail: object }>
) => putEvents(eventbridge, source, events);

export const putEvents = async (
	eventbridge: EventBridge,
	source: string,
	events: Array<{ detailType: string; detail: object }>
) => {
	logger.info({ events });

	return eventbridge
		.putEvents({
			Entries: events.map(event => ({
				Source: source,
				DetailType: event.detailType,
				Detail: JSON.stringify(event.detail)
			}))
		})
		.promise();
};
