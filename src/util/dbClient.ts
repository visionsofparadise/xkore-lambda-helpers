import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ResourceList, ResourcePrimaryKey } from '../models/Resource';
import day from 'dayjs';
import { response, BAD_REQUEST_400 } from './response';

type WithDefaults<I> = Omit<I, 'TableName'>;

export const dbClient = (docDB: DocumentClient, tableName: string) => {
	const queryDefaults = {
		TableName: tableName
	};

	return {
		get: async <Data extends ResourcePrimaryKey>(query: WithDefaults<DocumentClient.GetItemInput>) => {
			console.log({ query });

			const data = (docDB
				.get({ ...queryDefaults, ...query })
				.promise()
				.then(result => result.Item) as unknown) as Promise<Data>;

			console.log({ data });

			return data;
		},

		put: async <Data extends ResourcePrimaryKey>(query: WithDefaults<DocumentClient.PutItemInput>, isNew?: boolean) => {
			console.log({ query });

			const timestamp = day().unix();

			const data = ((await docDB
				.put({
					...queryDefaults,
					...query,
					ConditionExpression:
						isNew && !query.ConditionExpression ? 'attribute_not_exists(pk) AND attribute_not_exists(sk)' : undefined,
					Item: {
						...query.Item,
						updatedAt: timestamp,
						createdAt: isNew ? timestamp : query.Item.createdAt
					}
				})
				.promise()
				.then(result => result.Attributes)
				.catch(error => {
					console.log({ error });

					if (error.code === 'ConditionalCheckFailedException' && isNew) {
						throw response(BAD_REQUEST_400('Resource already exists'));
					}

					throw error;
				})) as unknown) as Promise<Data>;

			console.log({ data });

			return data;
		},
		update: async <Data extends ResourcePrimaryKey>(query: WithDefaults<DocumentClient.UpdateItemInput>) => {
			console.log({ query });

			const timestamp = day().unix();

			const data = ((await docDB
				.update({
					...queryDefaults,
					...query,
					UpdateExpression:
						query.UpdateExpression +
						(query.UpdateExpression!.substr(0, 3) === 'SET' ? ', ' : ' SET ') +
						'updatedAt = :updatedAt',
					ExpressionAttributeValues: {
						...query.ExpressionAttributeValues,
						':updatedAt': timestamp
					}
				})
				.promise()
				.then(result => result.Attributes)) as unknown) as Promise<Data>;

			console.log({ data });

			return data;
		},

		query: async <Data extends ResourcePrimaryKey>(query: WithDefaults<DocumentClient.QueryInput>) => {
			console.log({ query });

			const data = (await docDB.query({ ...queryDefaults, ...query }).promise()) as ResourceList<Data>;

			console.log({ data });

			return data;
		},
		scan: async <Data extends ResourcePrimaryKey>(query: WithDefaults<DocumentClient.ScanInput>) => {
			console.log({ query });

			return (docDB.scan({ ...queryDefaults, ...query }).promise() as unknown) as ResourceList<Data>;
		},

		delete: async (query: WithDefaults<DocumentClient.DeleteItemInput>) => {
			console.log({ query });

			return docDB
				.delete({
					...queryDefaults,
					...query,
					ConditionExpression: query.ConditionExpression || 'attribute_exists(pk) AND attribute_exists(sk)'
				})
				.promise();
		}
	};
};
