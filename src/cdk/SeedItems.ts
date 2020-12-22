import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { IItem } from '../Item';
import { Table } from '@aws-cdk/aws-dynamodb';
import { Converter } from 'aws-sdk/clients/dynamodb';

export interface SeedItemsProps {
	tableArn: string;
	items: Array<IItem>;
}

export class SeedItems extends Construct {
	constructor(scope: Construct, id: string, props: SeedItemsProps) {
		super(scope, id);

		const db = Table.fromTableArn(this, id + 'Table', props.tableArn);

		for (let i = 0; i < props.items.length; i++) {
			const item = props.items[i];
			const physicalResourceId = PhysicalResourceId.of(item.sk);
			const TableName = db.tableName;

			const onCreate: AwsSdkCall = {
				physicalResourceId,
				service: 'DynamoDB',
				action: 'putItem',
				parameters: {
					TableName,
					Item: Converter.marshall(item)
				}
			};

			const onUpdate: AwsSdkCall = {
				physicalResourceId,
				service: 'DynamoDB',
				action: 'putItem',
				parameters: {
					TableName,
					Item: Converter.marshall(item)
				}
			};

			const { pk, sk } = item;

			const onDelete: AwsSdkCall = {
				service: 'DynamoDB',
				action: 'deleteItem',
				parameters: {
					TableName,
					Key: Converter.marshall({ pk, sk })
				}
			};

			new AwsCustomResource(this, id + 'CustomResource' + i, {
				resourceType: 'Custom::' + id,
				policy: AwsCustomResourcePolicy.fromStatements([
					new PolicyStatement({
						effect: Effect.ALLOW,
						resources: [db.tableArn],
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
