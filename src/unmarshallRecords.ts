import { DynamoDBRecord } from 'aws-lambda/trigger/dynamodb-stream';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { logger } from './helpers/logger';
import { IItem } from './Item';

export type Records<OldItem, NewItem> = Array<Record<OldItem, NewItem>>;

export interface Record<OldItem, NewItem> {
	newRecord: NewItem;
	oldRecord: OldItem;
}

export const unmarshallRecords = <OldItem extends IItem | undefined, NewItem extends IItem | undefined>(
	records: Array<DynamoDBRecord>
): Records<OldItem, NewItem> =>
	records.map(r => {
		if (!r.dynamodb) throw new Error('Invalid record');

		const newRecord = r.dynamodb.NewImage && Converter.unmarshall(r.dynamodb.NewImage);
		const oldRecord = r.dynamodb.OldImage && Converter.unmarshall(r.dynamodb.OldImage);

		const records = { newRecord, oldRecord };

		logger.log({ records });

		return records;
	}) as Records<OldItem, NewItem>;
