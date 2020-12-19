import { EventBridge } from 'aws-sdk';
import { nanoid } from 'nanoid';
import { Event } from '../Event';
import { TestResource } from './TestResource';

const testResource = new TestResource({ testAttribute: nanoid() });

it('throws internal server error', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailSchema: TestResource.schema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockRejectedValue('error')
			})
		} as unknown) as EventBridge
	});

	await event.send(testResource.data).catch(error => expect(error).toBeDefined());

	return;
});

it('sends event', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailSchema: TestResource.schema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockResolvedValue('success')
			})
		} as unknown) as EventBridge
	});

	await event.send(testResource.data);

	expect(true).toBeTruthy();

	return;
});

it('sends events', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailSchema: TestResource.schema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockResolvedValue('success')
			})
		} as unknown) as EventBridge
	});

	await event.send([testResource.data, testResource.data, testResource.data]);

	expect(true).toBeTruthy();

	return;
});
