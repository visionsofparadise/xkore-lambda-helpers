import { dbClient } from '../util/dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { ObjectSchema, string, number, object, boolean } from 'yup';

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

export class Resource<
	AddedAttributes extends object,
	Attributes extends BaseResource = AddedAttributes & BaseResource
> {
	public static resourceType = Resource.name;

	protected db: ReturnType<typeof dbClient>;
	protected validationSchema: ObjectSchema<BaseResource> = object({
		pk: string().required(),
		sk: string().required(),
		resourceType: string().default(Resource.resourceType),
		isTestResource: boolean(),
		createdAt: number().positive().integer().default(day().unix()),
		updatedAt: number().positive().integer().default(day().unix())
	});
	protected hiddenKeys: Array<keyof Attributes> = [];
	protected ownerKeys: Array<keyof Attributes> = [];

	protected initial: Attributes;
	protected current: Attributes;

	constructor(props: {
		attributes: Omit<Attributes, 'createdAt' | 'updatedAt' | 'resourceType'> & Partial<Attributes>;
		config: {
			db: ReturnType<typeof dbClient>;
			validationSchema: ObjectSchema<AddedAttributes>;
			hiddenKeys: Array<keyof Attributes>;
			ownerKeys: Array<keyof Attributes>;
		};
	}) {
		this.db = props.config.db;
		this.validationSchema = this.validationSchema.concat(props.config.validationSchema);
		this.hiddenKeys = [...props.config.hiddenKeys, ...this.hiddenKeys];
		this.ownerKeys = [...props.config.ownerKeys, ...this.ownerKeys];

		const attributes = {
			...props.attributes,
			createdAt: props.attributes.createdAt || day().unix(),
			updatedAt: props.attributes.updatedAt || day().unix(),
			resourceType: props.attributes.resourceType || Resource.resourceType
		} as Attributes;

		this.initial = attributes;
		this.current = attributes;
	}

	get data() {
		return this.current;
	}

	set(data: Partial<Attributes>) {
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
		await this.validationSchema.validate(this.current);

		return this.current;
	};

	delete = async () => {
		await this.db.delete({
			Key: this.pk
		});

		return;
	};
}
