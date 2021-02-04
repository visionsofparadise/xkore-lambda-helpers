import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { logger } from './logger';
import { IPrimaryKey, IItem } from './Item';
import { Response, BAD_REQUEST_400, NOT_FOUND_404 } from './Response';
import upick from 'upick';

type WithDefaults<I> = Omit<I, 'TableName'>;

export interface ItemList<Item extends IPrimaryKey> {
	Items?: Array<Item> | undefined;
	LastEvaluatedKey?: IPrimaryKey;
}

export const dbClient = (documentClient: DocumentClient, tableName: string) => {
	const queryDefaults = {
		TableName: tableName
	};

	const client = {
		get: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.GetItemInput>) => {
			logger.info({ query });

			const data = await documentClient.get({ ...queryDefaults, ...query }).promise();

			if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) throw new Response(NOT_FOUND_404);

			logger.info({ data });

			return data.Item as Promise<Data>;
		},

		put: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.PutItemInput>, isNew?: boolean) => {
			logger.info({ query });

			const putData = async () =>
				documentClient
					.put({
						...queryDefaults,
						...query
					})
					.promise()
					.then(result => result.Attributes as Data);

			let data;

			if (isNew) {
				await client
					.get({
						Key: upick(query.Item, ['pk', 'sk'])
					})
					.then(() => {
						throw new Response(BAD_REQUEST_400('Item already exists'));
					})
					.catch(async err => {
						if (err.statusCode === 404) data = await putData();
						else throw err;
					});
			} else {
				data = await putData();
			}

			logger.info({ data });

			return data;
		},

		update: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.UpdateItemInput>) => {
			logger.info({ query });

			const data = ((await documentClient
				.update({
					...queryDefaults,
					...query
				})
				.promise()
				.then(result => result.Attributes)) as unknown) as Promise<Data>;

			logger.info({ data });

			return data;
		},

		query: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.QueryInput>) => {
			logger.info({ query });

			const data = (await documentClient.query({ ...queryDefaults, ...query }).promise()) as ItemList<Data>;

			logger.info({ data });

			return data;
		},

		scan: async <Data extends IPrimaryKey>(query?: WithDefaults<DocumentClient.ScanInput>) => {
			logger.info({ query });

			return (documentClient.scan({ ...queryDefaults, ...query }).promise() as unknown) as ItemList<Data>;
		},

		delete: async (query: WithDefaults<DocumentClient.DeleteItemInput>) => {
			logger.info({ query });

			await client.get(query);

			return documentClient
				.delete({
					...queryDefaults,
					...query
				})
				.promise();
		},

		reset: async () => {
			const scanData = await client.scan<IItem & { isSystemItem?: boolean }>({
				ProjectionExpression: 'pk, sk, isSystemItem'
			});

			logger.info(scanData);

			for (const data of scanData.Items!) {
				if (!data.isSystemItem) {
					logger.info('deleting item');
					logger.info(data);

					await client.delete({
						Key: {
							pk: data.pk,
							sk: data.sk
						}
					});
				}
			}

			return;
		}
	};

	return client;
};
