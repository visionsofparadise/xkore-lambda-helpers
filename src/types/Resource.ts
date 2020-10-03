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
