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

export interface JSONSchema {
	schemaName: string;
	schemaJSON: string;
}

export interface IDocumentation extends IItem {
	service: string;
	stage: string;
	type: 'endpoint' | 'item' | 'event' | 'rule';
	group?: string;
	path?: string;
	method?: string;
	id: string;
	tags: Array<string>;
	jsonSchemas: Array<JSONSchema>;
}

const jsonSchema = jsonObjectSchemaGenerator<IDocumentation>({
	$id: 'Documentation',
	description: 'Documentation containing deployment info and JSON schemas for resources, events and more.',
	properties: {
		...Item.resourceSchema.properties!,
		service: { type: 'string' },
		stage: { type: 'string' },
		type: { type: 'string', nullable: true },
		group: { type: 'string', nullable: true },
		path: { type: 'string', nullable: true },
		method: { type: 'string', nullable: true },
		id: { type: 'string' },
		jsonSchemas: {
			type: 'array',
			items: jsonObjectSchemaGenerator({
				$id: 'JSONSchema',
				description: 'The schema name and JSON',
				properties: {
					schemaName: { type: 'string' },
					schemaJSON: { type: 'string' }
				}
			})
		},
		tags: { type: 'array', items: { type: 'string' } }
	}
});

export class Documentation extends Item<IDocumentation> {
	public static documentClient = documentClient;
	public static tableName = 'test';
	public static jsonSchema = jsonSchema;
	public static hiddenKeys = [];
	public static ownerKeys = [];

	constructor({ id = nanoid(), ...params }: OptionalKeys<IDocumentation, keyof IItem | 'tags' | 'group'>) {
		super(
			{
				...params,
				pk: params.pk || Documentation.jsonSchema.$id!,
				sk: params.sk || `${params.stage}-${id}`,
				id,
				isSystemItem: true,
				resourceType: params.resourceType || Documentation.jsonSchema.$id!,
				tags: params.tags || []
			},
			Documentation
		);
	}

	static pk = ({ id, stage }: Pick<IDocumentation, 'id' | 'stage'>) => ({
		pk: Documentation.jsonSchema.$id!,
		sk: `${stage}-${id}`
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
					':pk': Documentation.jsonSchema.$id!,
					':stage': params.stage
				}
			})
			.then(data => data.Items!.map(item => new Documentation(item)));
}
