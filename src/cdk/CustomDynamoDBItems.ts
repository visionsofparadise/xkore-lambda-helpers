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

		const requestItems = (requestType: string, id: string) =>
			new CfnJson(this, 'JSONTokenKey' + id, {
				value: {
					[props.tableName]: props.items.map(item => ({
						[requestType]: {
							Item: item
						}
					}))
				}
			});

		const callDefaults = {
			service: 'DynamoDB',
			action: 'batchWriteItem'
		};

		const onCreate: AwsSdkCall = {
			physicalResourceId: PhysicalResourceId.of(props.tableName + '-' + id),
			...callDefaults,
			parameters: {
				RequestItems: requestItems('PutRequest', 'Create')
			}
		};

		const onUpdate: AwsSdkCall = {
			...callDefaults,
			parameters: {
				RequestItems: requestItems('PutRequest', 'Update')
			}
		};

		const onDelete: AwsSdkCall = {
			...callDefaults,
			parameters: {
				RequestItems: requestItems('DeleteRequest', 'Delete')
			}
		};

		this.returnData = new AwsCustomResource(this, id + 'CustomResource', {
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
		});
	}
}
