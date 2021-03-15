import { IPrimaryKey, IItem, RequiredKeys, Item } from './Item';
import { dbClient } from './dbClient';
import { documentClient } from './helpers/documentClient';
import { JSONSchemaType } from 'ajv';
import kuuid from 'kuuid';

export interface IDocumentation extends IItem {
	documentationName: string;
	documentationId: string;
	description?: string;
	service: string;
	type: 'endpoint' | 'item' | 'event' | 'rule';
	group?: string;
	tags: Array<string>;
	jsonSchemas: Array<string>;
}

export const documentationSchema: JSONSchemaType<IDocumentation> = {
	title: 'Documentation',
	description: 'Documentation containing deployment info and JSON schemas for items, events and more.',
	type: 'object',
	properties: {
		...Item.itemSchema.properties!,
		documentationName: { type: 'string' },
		documentationId: { type: 'string' },
		service: { type: 'string' },
		description: { type: 'string', nullable: true },
		type: { type: 'string', nullable: true },
		group: { type: 'string', nullable: true },
		jsonSchemas: {
			type: 'array',
			items: { type: 'string' }
		},
		tags: { type: 'array', items: { type: 'string' } }
	},
	required: [
		...Item.itemSchema.required,
		'documentationId',
		'documentationName',
		'type',
		'service',
		'jsonSchemas',
		'tags'
	],
	additionalProperties: true
};

export const documentationHelper = {};

const documentationHiddenKeys = Item.keys([]);
const documentationOwnerKeys = Item.keys([]);

export class Documentation extends Item<
	IDocumentation,
	typeof documentationHiddenKeys[number],
	typeof documentationOwnerKeys[number]
> {
	public static jsonSchema = documentationSchema;
	public static hiddenKeys = documentationHiddenKeys;
	public static ownerKeys = documentationOwnerKeys;

	constructor(params: RequiredKeys<IDocumentation, 'documentationName' | 'service' | 'type'> & { [x: string]: any }) {
		const id = kuuid.id();

		super(
			{
				...params,
				pk: params.pk || documentationSchema.title!,
				sk: params.sk || `${params.documentationName}-${id}`,
				documentationId: id,
				jsonSchemas: params.jsonSchemas || [],
				tags: params.tags || [],
				isSystemItem: true,
				itemType: params.itemType || documentationSchema.title!
			},
			{
				documentClient,
				tableName: 'test',
				jsonSchema: documentationSchema,
				hiddenKeys: documentationHiddenKeys,
				ownerKeys: documentationOwnerKeys
			}
		);
	}

	static pk = ({
		documentationId,
		documentationName
	}: Pick<IDocumentation, 'documentationId' | 'documentationName'>) => ({
		pk: documentationSchema.title!,
		sk: `${documentationName}-${documentationId}`
	});

	static get = async (params: IPrimaryKey, db: ReturnType<typeof dbClient>) => db.get<IDocumentation>({ Key: params });

	static list = async (db: ReturnType<typeof dbClient>) =>
		db.query<IDocumentation>({
			KeyConditionExpression: `pk = :pk`,
			ExpressionAttributeValues: {
				':pk': documentationSchema.title!
			}
		});
}
