import { DynamoDBRecord } from 'aws-lambda/trigger/dynamodb-stream';
import { logger } from './logger';
import { Records, Record } from './unmarshallRecords';

export type StreamFn = (r: Array<DynamoDBRecord>) => Promise<Array<any>>;

export const eventNameFilter = (eventName: string) => (r: DynamoDBRecord): boolean =>
	r.eventName === eventName && r.dynamodb ? true : false;

export const itemTypeFilter = (itemType: string) => (r: DynamoDBRecord): boolean =>
	r.dynamodb && r.dynamodb.NewImage && r.dynamodb.NewImage.itemType.S === itemType
		? true
		: r.dynamodb && r.dynamodb.OldImage && r.dynamodb.OldImage.itemType.S === itemType
		? true
		: false;

export const streamMap = <Old, New>(mapFn: (r: Record<Old, New>) => Promise<any>) => async (rs: Records<Old, New>) => {
	await Promise.all(rs.map(async r => mapFn(r).catch(logger.log)));

	logger.log(`Processed ${rs.length} items`);

	return rs;
};
