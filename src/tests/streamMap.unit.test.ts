import { streamMap } from '../streamUtils';
import { Record } from '../unmarshallRecords';

it('runs stream function on each record', async () => {
	const mockFn = jest.fn().mockImplementation(async () => {
		return;
	});

	const streamFn = async (r: Record<unknown, unknown>) => {
		console.log(r);
		await mockFn();

		return r;
	};

	const records = (['1', '2', '3'] as unknown) as Array<Record<unknown, unknown>>;

	await streamMap(streamFn)(records);

	expect(mockFn).toBeCalledTimes(3);

	return;
});
