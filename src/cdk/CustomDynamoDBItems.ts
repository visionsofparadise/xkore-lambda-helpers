import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { CfnJson, Construct } from '@aws-cdk/core';
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

		const requestItems = (requestType: string) =>
			new CfnJson(this, 'JSONTableNameToken', {
				value: {
					[props.tableName]: props.items.map(item => ({
						[requestType]: {
							Item: item
						}
					}))
				}
			});

		const onCreate: AwsSdkCall = {
			physicalResourceId: PhysicalResourceId.of(props.tableName + '-' + id),
			service: 'DynamoDB',
			action: 'batchWriteItem',
			parameters: {
				RequestItems: requestItems('PutRequest')
			}
		};

		const { physicalResourceId, ...onUpdate } = onCreate;

		const onDelete: AwsSdkCall = {
			service: 'DynamoDB',
			action: 'batchWriteItem',
			parameters: {
				RequestItems: requestItems('DeleteRequest')
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
