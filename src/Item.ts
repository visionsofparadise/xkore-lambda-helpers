import { dbClient } from './dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { JSONSchemaType, ValidateFunction } from 'ajv';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { jsonObjectSchemaGenerator } from './jsonObjectSchemaGenerator';
import { logger } from './logger';
import { Response, BAD_REQUEST_400 } from './Response';
import { ajv } from './ajv';

export type RequiredKeys<Data extends object, Keys extends keyof Data> = Pick<Data, Keys> & Partial<Omit<Data, Keys>>;
export type OptionalKeys<Data extends object, Keys extends keyof Data> = Omit<Data, Keys> & Partial<Pick<Data, Keys>>;

export interface IPrimaryKey {
	pk: string;
	sk: string;
}

export const primaryKeySchema = jsonObjectSchemaGenerator<IPrimaryKey>({
	title: 'PrimaryKey',
	description: 'Partition key and sort key.',
	properties: {
		pk: { type: 'string' },
		sk: { type: 'string' }
	}
});

export interface IItem extends IPrimaryKey {
	itemType: string;
	isSystemItem?: boolean;
	createdAt: number;
	updatedAt: number;
}

export const itemSchema = jsonObjectSchemaGenerator<IItem>({
	title: 'Item',
	description: 'Item',
	properties: {
		...primaryKeySchema.properties!,
		itemType: { type: 'string' },
		isSystemItem: { type: 'boolean', nullable: true },
		createdAt: { type: 'number' },
		updatedAt: { type: 'number' }
	},
	additionalProperties: true
});

export class Item<Schema extends IItem> {
	public static readonly primaryKeySchema = primaryKeySchema;
	public static readonly itemSchema = itemSchema;
	public static tags: Array<string> = [];
	public static readonly jsonSchema: object;

	protected _jsonSchema: JSONSchemaType<Schema>;
	protected _validator: ValidateFunction<Schema>;
	protected _hiddenKeys: Array<keyof Schema>;
	protected _ownerKeys: Array<keyof Schema>;
	protected _db: ReturnType<typeof dbClient>;
	protected _onValidate: () => Promise<void> | void;
	protected _onSave: () => Promise<void> | void;
	protected _onCreate: () => Promise<void> | void;
	protected _onDelete: () => Promise<void> | void;

	protected _initial: Schema;
	protected _current: Schema;

	constructor(
		props: OptionalKeys<Schema, 'createdAt' | 'updatedAt'>,
		config: {
			jsonSchema: JSONSchemaType<Schema>;
			tags?: Array<string>;
			hiddenKeys: Array<keyof Schema>;
			ownerKeys: Array<keyof Schema>;
			documentClient: DocumentClient;
			tableName: string;
			onValidate?: () => Promise<void> | void;
			onSave?: () => Promise<void> | void;
			onCreate?: () => Promise<void> | void;
			onDelete?: () => Promise<void> | void;
		}
	) {
		this._jsonSchema = config.jsonSchema;
		this._validator = ajv.compile(this._jsonSchema);
		this._hiddenKeys = config.hiddenKeys;
		this._ownerKeys = config.ownerKeys;
		this._db = dbClient(config.documentClient, config.tableName);

		this._onValidate = config.onValidate ? config.onValidate : () => {};
		this._onSave = config.onSave ? config.onSave : () => {};
		this._onCreate = config.onCreate ? config.onCreate : () => {};
		this._onDelete = config.onDelete ? config.onDelete : () => {};

		const attributes = {
			...props,
			createdAt: props.createdAt || day().unix(),
			updatedAt: props.updatedAt || day().unix(),
			itemType: props.itemType || Item.itemSchema.title
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

	public save = async () => {
		await this._onSave();

		await this.validate();

		await this._db.put({
			Item: this._current
		});

		return this;
	};

	public create = async () => {
		await this._onCreate();

		await this.validate();

		await this._db.create({
			Item: this._current
		});

		return this;
	};

	public delete = async () => {
		await this._onDelete();

		await this._db.delete({
			Key: this.pk
		});

		return;
	};

	public validate = async () => {
		await this._onValidate();

		logger.info('validating...');

		const result = this._validator(this._current);

		if (!result) throw new Response(BAD_REQUEST_400(this._validator.errors!));

		return true;
	};
}
