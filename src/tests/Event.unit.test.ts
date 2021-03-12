import { EventBridge } from 'aws-sdk';
import kuuid from 'kuuid';
import { Event } from '../Event';
import { TestItem, testItemJSONSchema } from './TestItem';

const testItem = new TestItem({ testAttribute: kuuid.id() });

it('throws internal server error', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailJSONSchema: testItemJSONSchema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockRejectedValue('error')
			})
		} as unknown) as EventBridge
	});

	await event.send(testItem.data).catch(error => expect(error).toBeDefined());

	return;
});

it('sends event', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailJSONSchema: testItemJSONSchema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockResolvedValue('success')
			})
		} as unknown) as EventBridge
	});

	await event.send(testItem.data);

	expect(true).toBeTruthy();

	return;
});

it('sends events', async () => {
	const event = new Event({
		source: 'test',
		detailType: 'test',
		detailJSONSchema: testItemJSONSchema,
		eventbridge: ({
			putEvents: jest.fn().mockReturnValue({
				promise: jest.fn().mockResolvedValue('success')
			})
		} as unknown) as EventBridge
	});

	await event.send([testItem.data, testItem.data, testItem.data]);

	expect(true).toBeTruthy();

	return;
});
