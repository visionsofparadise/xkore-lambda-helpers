import { BaseResource } from '../types/Resource';
import { dbClient } from '../util/dbClient';
import pick from 'object.pick';
import omit from 'object.omit';
import day from 'dayjs';
import * as yup from 'yup';

interface Config<Data extends object & BaseResource> {
	db: ReturnType<typeof dbClient>;
	eventbridge: AWS.EventBridge;
	validationSchema: yup.ObjectSchema<Data>;
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
					validationSchema: yup.ObjectSchema<Attributes>;
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

			...omit(params, 'config')
		} as Data;

		this.initial = data;
		this.current = data;

		this.config = {
			db: params.config.db,
			eventbridge: params.config.eventbridge,

			hiddenKeys: params.config.hiddenKeys || [],
			ownerKeys: params.config.ownerKeys || [],

			validationSchema: yup
				.object({
					pk: yup.string().required(),
					sk: yup.string().required(),
					resourceType: yup.string().required(),
					createdAt: yup.number().positive().integer().required(),
					updatedAt: yup.number().positive().integer().required()
				})
				.concat(params.config.validationSchema) as yup.ObjectSchema<Data>
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
		return omit(this.current, this.config.hiddenKeys);
	}

	get public() {
		return omit(this.current, [...this.config.hiddenKeys, ...this.config.ownerKeys]);
	}

	get pk() {
		return pick(this.current, ['pk', 'sk']);
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
