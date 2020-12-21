import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { CfnJson, Construct } from '@aws-cdk/core';
import { IItem } from '../Item';

export interface SystemItemsProps {
	physicalResourceId: string;
	tableName: string;
	tableArn: string;
	items: Array<IItem>;
}

export class SystemItems extends Construct {
	public readonly returnData: AwsCustomResource;

	constructor(scope: Construct, id: string, props: SystemItemsProps) {
		super(scope, id);

		const putItems = new CfnJson(this, 'PutJSONTokenKey', {
			value: {
				[props.tableName]: props.items.map(item => ({
					PutRequest: {
						Item: item
					}
				}))
			}
		});

		const callDefaults = {
			service: 'DynamoDB',
			action: 'batchWriteItem'
		};

		const physicalResourceId = PhysicalResourceId.of(props.physicalResourceId);

		const onCreate: AwsSdkCall = {
			physicalResourceId,
			...callDefaults,
			parameters: {
				RequestItems: putItems
			}
		};

		const onUpdate: AwsSdkCall = {
			physicalResourceId,
			...callDefaults,
			parameters: {
				RequestItems: putItems
			}
		};

		const deleteItems = new CfnJson(this, 'DeleteJSONTokenKey', {
			value: {
				[props.tableName]: props.items.map(item => {
					const { pk, sk } = item;

					return {
						DeleteRequest: {
							Item: { pk, sk }
						}
					};
				})
			}
		});

		const onDelete: AwsSdkCall = {
			...callDefaults,
			parameters: {
				RequestItems: deleteItems
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
