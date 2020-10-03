import EventBridge from 'aws-sdk/clients/eventbridge';
import { xlhLogger } from '../util/logger';
import { Event } from '../models/Event';

interface IEvent {
	Detail: object;
	DetailType: string;
}

export const createEventHelper = (params: { eventbridge: EventBridge; Source: string }) => ({
	send: async (event: IEvent | Array<IEvent>) => {
		xlhLogger.log({ event });

		return params.eventbridge
			.putEvents({
				Entries: Array.isArray(event)
					? event.map(e => new Event({ ...params, ...e }))
					: [new Event({ ...params, ...event })]
			})
			.promise();
	}
});
