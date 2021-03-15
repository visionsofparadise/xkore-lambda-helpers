import { dbClient } from './dbClient';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import day from 'dayjs';
import { JSONSchemaType, ValidateFunction } from 'ajv';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { logger } from './helpers/logger';
import { Response, BAD_REQUEST_400 } from './Response';
import { ajv } from './helpers/ajv';

export type RequiredKeys<Data extends object, Keys extends keyof Data> = Pick<Data, Keys> & Partial<Omit<Data, Keys>>;
export type OptionalKeys<Data extends object, Keys extends keyof Data> = Omit<Data, Keys> & Partial<Pick<Data, Keys>>;

export interface IPrimaryKey {
	pk: string;
	sk: string;
}

export const primaryKeySchema: JSONSchemaType<IPrimaryKey> = {
	title: 'PrimaryKey',
	description: 'Partition key and sort key.',
	type: 'object',
	properties: {
		pk: { type: 'string' },
		sk: { type: 'string' }
	},
	required: ['pk', 'sk']
};

export interface IItem extends IPrimaryKey {
	itemType: string;
	isSystemItem?: boolean;
	createdAt: number;
	updatedAt: number;
}

export const itemSchema: JSONSchemaType<IItem> = {
	title: 'Item',
	description: 'Item',
	type: 'object',
	properties: {
		...primaryKeySchema.properties!,
		itemType: { type: 'string', default: 'Item' },
		isSystemItem: { type: 'boolean', nullable: true },
		createdAt: { type: 'number' },
		updatedAt: { type: 'number' }
	},
	required: ['pk', 'sk', 'createdAt', 'updatedAt'],
	additionalProperties: true
};

export interface IItemConfig<Schema extends IItem, HiddenKey extends keyof Schema, OwnerKey extends keyof Schema> {
	jsonSchema: JSONSchemaType<Schema>;
	onValidate?: () => Promise<void> | void;
	onSave?: () => Promise<void> | void;
	onCreate?: () => Promise<void> | void;
	onDelete?: () => Promise<void> | void;
	hiddenKeys: Array<HiddenKey>;
	ownerKeys: Array<OwnerKey>;
	documentClient: DocumentClient;
	tableName: string;
}
export class Item<Schema extends IItem, HiddenKey extends keyof Schema, OwnerKey extends keyof Schema> {
	public static tags: Array<string> = [];
	public static keys = <K extends string>(keys: Array<K>) => keys;

	protected _jsonSchema: JSONSchemaType<Schema>;
	protected _validator: ValidateFunction<Schema>;
	protected _onValidate: () => Promise<void> | void;
	protected _onSave: () => Promise<void> | void;
	protected _onCreate: () => Promise<void> | void;
	protected _onDelete: () => Promise<void> | void;
	protected _hiddenKeys: Array<HiddenKey>;
	protected _ownerKeys: Array<OwnerKey>;
	protected _db: ReturnType<typeof dbClient>;

	protected _initial: Schema;
	protected _current: Schema;

	constructor(
		props: OptionalKeys<Schema, 'createdAt' | 'updatedAt'>,
		config: IItemConfig<Schema, HiddenKey, OwnerKey>
	) {
		this._jsonSchema = config.jsonSchema;
		this._validator = ajv.compile(this._jsonSchema);
		this._onValidate = config.onValidate ? config.onValidate : () => {};
		this._onSave = config.onSave ? config.onSave : () => {};
		this._onCreate = config.onCreate ? config.onCreate : () => {};
		this._onDelete = config.onDelete ? config.onDelete : () => {};
		this._hiddenKeys = config.hiddenKeys;
		this._ownerKeys = config.ownerKeys;
		this._db = dbClient(config.documentClient, config.tableName);

		const attributes = {
			...props,
			createdAt: props.createdAt || day().unix(),
			updatedAt: props.updatedAt || day().unix()
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

		return;
	}

	public get init() {
		return this._initial;
	}

	public get owner() {
		return omit(this._current, this._hiddenKeys);
	}

	public get public() {
		return omit(this._current, [...this._hiddenKeys, ...this._ownerKeys]);
	}

	public get pk() {
		return pick(this._current, ['pk', 'sk']);
	}

	public save = async () => {
		await this.validate();

		await this._onSave();

		await this._db.put({
			Item: this._current
		});

		return this;
	};

	public create = async () => {
		await this.validate();

		await this._onCreate();

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
		logger.info('validating...');

		await this._onValidate();

		const result = this._validator(this._current);

		if (!result) throw new Response(BAD_REQUEST_400(this._validator.errors));

		return true;
	};
}
