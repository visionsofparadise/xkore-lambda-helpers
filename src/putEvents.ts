import { EventBridge } from 'aws-sdk';
import { logger } from './helpers/logger';

export const putEvents = async (eventbridge: EventBridge, source: string, events: Array<{ 0: string; 1: object }>) => {
	logger.info({ events });

	return eventbridge
		.putEvents({
			Entries: events.map(event => ({
				Source: source,
				DetailType: event[0],
				Detail: JSON.stringify(event[1])
			}))
		})
		.promise();
};

export const createPutEvents = (eventbridge: EventBridge, source: string) => async (
	events: Array<{ 0: string; 1: object }>
) => putEvents(eventbridge, source, events);
