import { dbClient } from '../util/dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { ObjectSchema, string, number, object } from 'yup';
import EventBridge from 'aws-sdk/clients/eventbridge';

export type ResourcePrimaryKey = {
	pk: string;
	sk: string;
};

export type BaseResource = {
	resourceType: string;
	createdAt: number;
	updatedAt: number;
} & ResourcePrimaryKey;

export interface ResourceList<Resource extends ResourcePrimaryKey> {
	Items?: Array<Resource> | undefined;
	LastEvaluatedKey?: ResourcePrimaryKey;
}

interface Config<Data extends object & BaseResource> {
	db: ReturnType<typeof dbClient>;
	eventbridge: EventBridge;
	validationSchema: ObjectSchema<Data>;
	hiddenKeys: Array<keyof Data>;
	ownerKeys: Array<keyof Data>;
}

export class Resource<Attributes extends object, Data extends Attributes & BaseResource = Attributes & BaseResource> {
	protected config!: Config<Data>;
	protected initial: Data;
	protected current: Data;

	constructor(
		params: Partial<Data> & {
			config: Pick<Config<Data>, 'db' | 'eventbridge'> &
				Partial<Pick<Config<Data>, 'hiddenKeys' | 'ownerKeys'>> & {
					validationSchema: ObjectSchema<Attributes>;
				};
		}
	) {
		const pk = params.pk;
		const sk = params.sk || pk;
		const timestamp = day().unix();

		const data = {
			pk,
			sk,

			resourceType: params.resourceType || 'Resource',
			createdAt: params.createdAt || timestamp,
			updatedAt: params.updatedAt || timestamp,

			...uomit(params, ['config'])
		} as Data;

		this.initial = data;
		this.current = data;

		this.config = {
			db: params.config.db,
			eventbridge: params.config.eventbridge,

			hiddenKeys: params.config.hiddenKeys || [],
			ownerKeys: params.config.ownerKeys || [],

			validationSchema: object({
				pk: string().required(),
				sk: string().required(),
				resourceType: string().required(),
				createdAt: number().positive().integer().required(),
				updatedAt: number().positive().integer().required()
			}).concat(params.config.validationSchema) as ObjectSchema<Data>
		};
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
		return uomit(this.current, this.config.hiddenKeys);
	}

	get public() {
		return uomit(this.current, [...this.config.hiddenKeys, ...this.config.ownerKeys]);
	}

	get pk() {
		return upick(this.current, ['pk', 'sk']);
	}

	save = async (isNew: boolean = false) => {
		const timestamp = day().unix();
		this.current.updatedAt = timestamp;

		await this.validate();

		await this.config.db.put(
			{
				Item: this.current
			},
			isNew
		);

		return this;
	};

	create = async () => this.save(true);

	validate = async () => {
		await this.config.validationSchema.validate(this.current);

		return this.current;
	};

	delete = async () => {
		await this.config.db.delete({
			Key: this.pk
		});

		return;
	};
}
