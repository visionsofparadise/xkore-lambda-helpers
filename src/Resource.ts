import { dbClient } from './dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { JSONSchemaType } from 'ajv';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { jsonObjectSchemaGenerator } from './jsonObjectSchemaGenerator';
import { logger } from './logger';
import { Response, BAD_REQUEST_400 } from './Response';
import { ajv } from './ajv';

export type ResourceGeneric = Resource<IResource>;
export type RequiredKeys<Data extends object, Keys extends keyof Data> = Pick<Data, Keys> & Partial<Omit<Data, Keys>>;
export type OptionalKeys<Data extends object, Keys extends keyof Data> = Omit<Data, Keys> & Partial<Pick<Data, Keys>>;

export interface IPrimaryKey {
	pk: string;
	sk: string;
}

export const primaryKeySchema = jsonObjectSchemaGenerator<IPrimaryKey>({
	$id: 'PrimaryKey',
	description: 'Partition key and sort key.',
	properties: {
		pk: { type: 'string' },
		sk: { type: 'string' }
	}
});

export interface IResource extends IPrimaryKey {
	resourceType: string;
	isSystemResource?: boolean;
	createdAt: number;
	updatedAt: number;
}

export const resourceSchema: JSONSchemaType<IResource> = jsonObjectSchemaGenerator<IResource>({
	$id: 'Resource',
	description: 'Resource',
	properties: {
		...primaryKeySchema.properties!,
		resourceType: { type: 'string' },
		isSystemResource: { type: 'boolean', nullable: true },
		createdAt: { type: 'number' },
		updatedAt: { type: 'number' }
	}
});

export class Resource<Schema extends IResource> {
	public static readonly primaryKeySchema = primaryKeySchema;
	public static readonly resourceSchema = resourceSchema;
	public static tags: Array<string> = [];
	public static readonly schema: object;

	protected _schema: JSONSchemaType<Schema>;
	protected _validatorFn: (data: Schema) => boolean;
	protected _hiddenKeys: Array<keyof Schema>;
	protected _ownerKeys: Array<keyof Schema>;
	protected _db: ReturnType<typeof dbClient>;

	protected _initial: Schema;
	protected _current: Schema;

	constructor(
		props: OptionalKeys<Schema, 'createdAt' | 'updatedAt'>,
		config: {
			schema: JSONSchemaType<Schema>;
			tags?: Array<string>;
			hiddenKeys: Array<keyof Schema>;
			ownerKeys: Array<keyof Schema>;
			documentClient: DocumentClient;
			tableName: string;
		}
	) {
		this._schema = config.schema;
		this._validatorFn = ajv.compile(this._schema);
		this._hiddenKeys = config.hiddenKeys;
		this._ownerKeys = config.ownerKeys;
		this._db = dbClient(config.documentClient, config.tableName);

		const attributes = {
			...props,
			createdAt: props.createdAt || day().unix(),
			updatedAt: props.updatedAt || day().unix(),
			resourceType: props.resourceType || Resource.resourceSchema.$id
		} as Schema;

		this._initial = attributes;
		this._current = attributes;

		logger.info({ attributes });
	}

	public get data() {
		return this._current;
	}

	public set(data: Partial<Schema>) {
		logger.info({ set: data });

		const updatedAt = day().unix();

		this._current = { ...this._current, ...data, updatedAt };

		this.validate();

		return;
	}

	public get init() {
		return this._initial;
	}

	public get owner() {
		return uomit(this._current, this._hiddenKeys);
	}

	public get public() {
		return uomit(this._current, [...this._hiddenKeys, ...this._ownerKeys]);
	}

	public get pk() {
		return upick(this._current, ['pk', 'sk']);
	}

	public save = async (isNew: boolean = false) => {
		this.validate();

		await this._db.put(
			{
				Item: this._current
			},
			isNew
		);

		return this;
	};

	public create = async () => this.save(true);

	public delete = async () => {
		await this._db.delete({
			Key: this.pk
		});

		return;
	};

	public validate = () => {
		logger.info('validating...');

		const result = this._validatorFn(this._current);

		if (!result) throw new Response(BAD_REQUEST_400('Invalid Data'));

		return true;
	};
}
