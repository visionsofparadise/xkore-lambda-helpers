import { DynamoDBRecord } from 'aws-lambda/trigger/dynamodb-stream';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { logger } from './logger';
import { IResource } from './Resource';

export type Records<OldResource, NewResource> = Array<Record<OldResource, NewResource>>;

export interface Record<OldResource, NewResource> {
	newRecord: NewResource;
	oldRecord: OldResource;
}

export const unmarshallRecords = <OldResource extends IResource | undefined, NewResource extends IResource | undefined>(
	records: Array<DynamoDBRecord>
): Records<OldResource, NewResource> =>
	records.map(r => {
		if (!r.dynamodb) throw new Error('Invalid record');

		const newRecord = r.dynamodb.NewImage && Converter.unmarshall(r.dynamodb.NewImage);
		const oldRecord = r.dynamodb.OldImage && Converter.unmarshall(r.dynamodb.OldImage);

		const records = { newRecord, oldRecord };

		logger.log({ records });

		return records;
	}) as Records<OldResource, NewResource>;
