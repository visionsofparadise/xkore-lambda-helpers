import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { IResource } from '../Resource';

export interface CustomDynamoDBItemsProps {
	tableName: string;
	tableArn: string;
	items: Array<IResource>;
}

export class CustomDynamoDBItems extends Construct {
	public readonly returnData: AwsCustomResource;

	constructor(scope: Construct, id: string, props: CustomDynamoDBItemsProps) {
		super(scope, id);

		const onCreate: AwsSdkCall = {
			physicalResourceId: PhysicalResourceId.of(props.tableName + '-' + id),
			service: 'DynamoDB',
			action: 'batchWriteItem',
			parameters: {
				TableName: props.tableName,
				RequestItems: {
					[props.tableName]: props.items.map(item => ({
						PutRequest: {
							Item: item
						}
					}))
				}
			}
		};

		const onUpdate: AwsSdkCall = onCreate;

		const onDelete: AwsSdkCall = {
			service: 'DynamoDB',
			action: 'batchWriteItem',
			parameters: {
				TableName: props.tableName,
				RequestItems: {
					[props.tableName]: props.items.map(item => ({
						DeleteRequest: {
							Key: {
								pk: item.pk,
								sk: item.sk
							}
						}
					}))
				}
			}
		};

		this.returnData = new AwsCustomResource(this, 'testUserRecord', {
			resourceType: 'Custom::DynamoDBUser',
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
		});
	}
}
