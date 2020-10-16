import { dbClient } from '../util/dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { ObjectSchema, string, number, object, boolean } from 'yup';
import AWS from 'aws-sdk';

export type ResourcePrimaryKey = {
	pk: string;
	sk: string;
};

export type BaseResource = {
	resourceType: string;
	isTestResource?: boolean;
	createdAt: number;
	updatedAt: number;
} & ResourcePrimaryKey;

export interface ResourceList<Resource extends ResourcePrimaryKey> {
	Items?: Array<Resource> | undefined;
	LastEvaluatedKey?: ResourcePrimaryKey;
}

export class Resource<Attributes extends object, Data extends Attributes & BaseResource = Attributes & BaseResource> {
	protected initial: Data;
	protected current: Data;

	public db: ReturnType<typeof dbClient> = dbClient(
		new AWS.DynamoDB.DocumentClient({
			endpoint: 'localhost:8000',
			sslEnabled: false,
			region: 'local-env'
		}),
		'test'
	);

	public baseValidationSchema: ObjectSchema<BaseResource> = object({
		pk: string().required(),
		sk: string().required(),
		resourceType: string().required(),
		isTestResource: boolean(),
		createdAt: number().positive().integer().required(),
		updatedAt: number().positive().integer().required()
	});
	public validationSchema: ObjectSchema<Attributes> = object();

	public hiddenKeys: Array<keyof Data> = [];
	public ownerKeys: Array<keyof Data> = [];

	constructor(params: Pick<Data, 'pk' | 'sk'> & Partial<Data>) {
		const pk = params.pk;
		const sk = params.sk || pk;
		const timestamp = day().unix();

		const data = {
			pk,
			sk,

			resourceType: params.resourceType || 'Resource',
			createdAt: params.createdAt || timestamp,
			updatedAt: params.updatedAt || timestamp
		} as Data;

		this.initial = data;
		this.current = data;
	}

	get data() {
		return this.current;
	}

	set(data: Partial<Data>) {
		this.current = { ...this.current, ...data };

		return;
	}

	get init() {
		return this.initial;
	}

	get owner() {
		return uomit(this.current, this.hiddenKeys);
	}

	get public() {
		return uomit(this.current, [...this.hiddenKeys, ...this.ownerKeys]);
	}

	get pk() {
		return upick(this.current, ['pk', 'sk']);
	}

	save = async (isNew: boolean = false) => {
		const timestamp = day().unix();
		this.current.updatedAt = timestamp;

		await this.validate();

		await this.db.put(
			{
				Item: this.current
			},
			isNew
		);

		return this;
	};

	create = async () => this.save(true);

	validate = async () => {
		await this.baseValidationSchema.concat(this.validationSchema).validate(this.current);

		return this.current;
	};

	delete = async () => {
		await this.db.delete({
			Key: this.pk
		});

		return;
	};
}
