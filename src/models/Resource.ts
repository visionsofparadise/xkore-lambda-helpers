import { dbClient } from '../util/dbClient';
import upick from 'upick';
import uomit from 'uomit';
import day from 'dayjs';
import { ObjectSchema, string, number, object, boolean } from 'yup';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

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
	public static resourceType: string = 'Resource';

	protected db: ReturnType<typeof dbClient>;
	protected validationSchema: ObjectSchema<BaseResource> = object({
		pk: string().required(),
		sk: string().required(),
		resourceType: string().default(Resource.resourceType).required(),
		isTestResource: boolean(),
		createdAt: number().positive().integer().default(day().unix()).required(),
		updatedAt: number().positive().integer().default(day().unix()).required()
	});
	protected hiddenKeys: Array<keyof Attributes> = [];
	protected ownerKeys: Array<keyof Attributes> = [];

	protected initial: Attributes;
	protected current: Attributes;

	constructor(props: {
		attributes: Attributes;
		config: {
			db: DocumentClient;
			validationSchema: ObjectSchema<AddedAttributes>;
			hiddenKeys: Array<keyof Attributes>;
			ownerKeys: Array<keyof Attributes>;
		};
	}) {
		this.db = dbClient(props.config.db, process.env.DYNAMODB_TABLE!);
		this.validationSchema = this.validationSchema.concat(props.config.validationSchema);
		this.hiddenKeys = [...props.config.hiddenKeys, ...this.hiddenKeys];
		this.ownerKeys = [...props.config.ownerKeys, ...this.ownerKeys];

		this.initial = props.attributes;
		this.current = props.attributes;
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
