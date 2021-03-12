import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { logger } from './helpers/logger';
import { IPrimaryKey, IItem } from './Item';
import { Response, NOT_FOUND_404, BAD_REQUEST_400 } from './Response';

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

			if (!data || !data.Item || (typeof data === 'object' && Object.keys(data).length === 0))
				throw new Response(NOT_FOUND_404);

			logger.info({ data });

			return data.Item as Promise<Data>;
		},

		put: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.PutItemInput>) => {
			logger.info({ query });

			const data = await documentClient
				.put({
					...queryDefaults,
					...query
				})
				.promise()
				.then(result => result.Attributes as Data);

			logger.info({ data });

			return data;
		},

		create: async (query: WithDefaults<DocumentClient.PutItemInput>) => {
			logger.info({ query });

			const { pk, sk } = query.Item;

			try {
				await client.get({
					Key: { pk, sk }
				});

				throw new Response(BAD_REQUEST_400('Item already exists'));
			} catch (error) {
				return client.put({
					...queryDefaults,
					...query
				});
			}
		},

		update: async <Data extends IPrimaryKey>(query: WithDefaults<DocumentClient.UpdateItemInput>) => {
			logger.info({ query });

			const data = await documentClient
				.update({
					...queryDefaults,
					...query
				})
				.promise()
				.then(result => result.Attributes as Data);

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
