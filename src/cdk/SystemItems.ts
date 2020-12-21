import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { IItem } from '../Item';

export interface SystemItemsProps {
	physicalResourceId: string;
	tableName: string;
	tableArn: string;
	items: Array<IItem>;
}

export class SystemItems extends Construct {
	public readonly returnData: Array<AwsCustomResource> = [];

	constructor(scope: Construct, id: string, props: SystemItemsProps) {
		super(scope, id);

		for (const item of props.items) {
			const physicalResourceId = PhysicalResourceId.of(props.physicalResourceId);
			const TableName = props.tableName;

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

			this.returnData.push(
				new AwsCustomResource(this, id + 'CustomResource', {
					resourceType: 'Custom::' + id,
					policy: AwsCustomResourcePolicy.fromStatements([
						new PolicyStatement({
							effect: Effect.ALLOW,
							resources: [props.tableArn],
							actions: ['dynamodb:PutItem', 'dynamodb:DeleteItem']
						})
					]),
					onCreate,
					onUpdate,
					onDelete
				})
			);
		}
	}
}
