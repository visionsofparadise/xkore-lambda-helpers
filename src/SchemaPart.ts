import { IPrimaryKey, IResource, OptionalKeys, Resource } from './Resource';
import AWS from 'aws-sdk';
import { jsonObjectSchemaGenerator } from './jsonObjectSchemaGenerator';
import { dbClient } from './dbClient';
import { nanoid } from 'nanoid';

const documentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

export interface ISchemaPart extends IResource {
	service: string;
	stage: string;
	group?: string;
	path?: string;
	method?: string;
	id: string;
	tags: Array<string>;
	schemas: Array<string>;
}

const schema = jsonObjectSchemaGenerator<ISchemaPart>({
	$id: 'SchemaPart',
	description: 'Schema and documentation for resources, events and more.',
	properties: {
		...Resource.resourceSchema.properties!,
		service: { type: 'string' },
		stage: { type: 'string' },
		group: { type: 'string', nullable: true },
		path: { type: 'string', nullable: true },
		method: { type: 'string', nullable: true },
		id: { type: 'string' },
		schemas: { type: 'array', items: { type: 'string' } },
		tags: { type: 'array', items: { type: 'string' } }
	}
});

export class SchemaPart extends Resource<ISchemaPart> {
	public static documentClient = documentClient;
	public static tableName = 'test';
	public static schema = schema;
	public static hiddenKeys = [];
	public static ownerKeys = [];

	constructor({ id = nanoid(), ...params }: OptionalKeys<ISchemaPart, keyof IResource | 'tags' | 'group'>) {
		super(
			{
				...params,
				pk: params.pk || SchemaPart.schema.$id!,
				sk: params.sk || `${params.stage}-${id}`,
				id,
				isSystemResource: true,
				resourceType: params.resourceType || SchemaPart.schema.$id!,
				tags: params.tags || []
			},
			SchemaPart
		);
	}

	static pk = ({ id, stage }: Pick<ISchemaPart, 'id' | 'stage'>) => ({
		pk: SchemaPart.schema.$id!,
		sk: `${stage}-${id}`
	});

	static get = async (params: IPrimaryKey, db: ReturnType<typeof dbClient>) =>
		db
			.get<ISchemaPart>({ Key: params })
			.then(data => new SchemaPart(data));

	static list = async (params: Pick<ISchemaPart, 'stage'>, db: ReturnType<typeof dbClient>) =>
		db
			.query<ISchemaPart>({
				KeyConditionExpression: `pk = :pk AND begins_with (sk, :stage)`,
				ExpressionAttributeValues: {
					':pk': SchemaPart.schema.$id!,
					':stage': params.stage
				}
			})
			.then(data => data.Items!.map(item => new SchemaPart(item)));
}
