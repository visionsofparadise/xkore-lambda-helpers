import { IPrimaryKey, IItem, OptionalKeys, Item } from './Item';
import AWS from 'aws-sdk';
import { jsonObjectSchemaGenerator } from './jsonObjectSchemaGenerator';
import { dbClient } from './dbClient';
import { nanoid } from 'nanoid';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface IDocumentation extends IItem {
	documentationName: string;
	documentationId: string;
	service: string;
	stage: string;
	type: 'endpoint' | 'item' | 'event' | 'rule';
	group?: string;
	authorizationType?: string;
	path?: string;
	method?: string;
	tags: Array<string>;
	jsonSchemas: Array<string>;
}

const jsonSchema = jsonObjectSchemaGenerator<IDocumentation>({
	title: 'Documentation',
	description: 'Documentation containing deployment info and JSON schemas for items, events and more.',
	properties: {
		...Item.itemSchema.properties!,
		documentationName: { type: 'string' },
		documentationId: { type: 'string' },
		service: { type: 'string' },
		stage: { type: 'string' },
		type: { type: 'string', nullable: true },
		group: { type: 'string', nullable: true },
		authorizationType: { type: 'string', nullable: true },
		path: { type: 'string', nullable: true },
		method: { type: 'string', nullable: true },
		jsonSchemas: {
			type: 'array',
			items: { type: 'string' }
		},
		tags: { type: 'array', items: { type: 'string' } }
	}
});

export class Documentation extends Item<IDocumentation> {
	public static documentClient = documentClient;
	public static tableName = 'test';
	public static jsonSchema = jsonSchema;
	public static hiddenKeys: Array<keyof IDocumentation> = ['pk', 'sk'];
	public static ownerKeys: Array<keyof IDocumentation> = [];

	constructor({
		documentationId = nanoid(),
		...params
	}: OptionalKeys<IDocumentation, keyof IItem | 'documentationId' | 'tags' | 'group'>) {
		super(
			{
				...params,
				pk: params.pk || Documentation.jsonSchema.title!,
				sk: params.sk || `${params.stage}-${params.documentationName}-${documentationId}`,
				documentationId,
				isSystemItem: true,
				itemType: params.itemType || Documentation.jsonSchema.title!,
				tags: params.tags || []
			},
			Documentation
		);
	}

	static pk = ({
		documentationId,
		stage,
		documentationName
	}: Pick<IDocumentation, 'documentationId' | 'stage' | 'documentationName'>) => ({
		pk: Documentation.jsonSchema.title!,
		sk: `${stage}-${documentationName}-${documentationId}`
	});

	static get = async (params: IPrimaryKey, db: ReturnType<typeof dbClient>) =>
		db
			.get<IDocumentation>({ Key: params })
			.then(data => new Documentation(data));

	static list = async (params: Pick<IDocumentation, 'stage'>, db: ReturnType<typeof dbClient>) =>
		db
			.query<IDocumentation>({
				KeyConditionExpression: `pk = :pk AND begins_with (sk, :stage)`,
				ExpressionAttributeValues: {
					':pk': Documentation.jsonSchema.title!,
					':stage': params.stage
				}
			})
			.then(data => data.Items!.map(item => new Documentation(item)));
}
