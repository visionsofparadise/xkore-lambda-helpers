import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { IItem } from '../Item';
import { ITable } from '@aws-cdk/aws-dynamodb';

export interface SeedItemsProps {
	db: ITable;
	items: Array<IItem>;
}

export class SeedItems extends Construct {
	constructor(scope: Construct, id: string, props: SeedItemsProps) {
		super(scope, id);

		for (let i = 0; i < props.items.length; i++) {
			const item = props.items[i];
			const physicalResourceId = PhysicalResourceId.of(item.sk);
			const TableName = props.db.tableName;

			const onCreate: AwsSdkCall = {
				physicalResourceId,
				service: 'DynamoDB',
				action: 'putItem',
				parameters: {
					TableName,
					Item: item
				}
			};

			const onUpdate: AwsSdkCall = {
				physicalResourceId,
				service: 'DynamoDB',
				action: 'putItem',
				parameters: {
					TableName,
					Item: item
				}
			};

			const { pk, sk } = item;

			const onDelete: AwsSdkCall = {
				service: 'DynamoDB',
				action: 'deleteItem',
				parameters: {
					TableName,
					Key: { pk, sk }
				}
			};

			new AwsCustomResource(this, id + 'CustomResource' + i, {
				resourceType: 'Custom::' + id,
				policy: AwsCustomResourcePolicy.fromStatements([
					new PolicyStatement({
						effect: Effect.ALLOW,
						resources: [props.db.tableArn],
						actions: ['dynamodb:PutItem', 'dynamodb:DeleteItem']
					})
				]),
				onCreate,
				onUpdate,
				onDelete
			});
		}
	}
}
