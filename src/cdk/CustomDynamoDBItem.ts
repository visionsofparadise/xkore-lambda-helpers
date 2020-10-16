import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, AwsSdkCall } from '@aws-cdk/custom-resources';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import AWS from 'aws-sdk';
import { BaseResource } from '../models/Resource';

export class CustomDynamoDBItem extends Construct {
	public readonly returnData: AwsCustomResource;

	constructor(scope: Construct, id: string, props: { tableName: string; tableArn: string; item: BaseResource }) {
		super(scope, id);

		const onCreate: AwsSdkCall = {
			physicalResourceId: PhysicalResourceId.of(props.tableName + '-' + props.item.pk),
			service: 'DynamoDB',
			action: 'putItem',
			parameters: {
				TableName: props.tableName,
				Item: AWS.DynamoDB.Converter.marshall(props.item)
			}
		};

		const onUpdate: AwsSdkCall = {
			physicalResourceId: PhysicalResourceId.of(props.tableName + '-' + props.item.pk),
			service: 'DynamoDB',
			action: 'putItem',
			parameters: {
				TableName: props.tableName,
				Item: AWS.DynamoDB.Converter.marshall(props.item)
			}
		};

		const onDelete: AwsSdkCall = {
			service: 'DynamoDB',
			action: 'deleteItem',
			parameters: {
				TableName: props.tableName,
				Key: AWS.DynamoDB.Converter.marshall({
					pk: props.item.pk,
					sk: props.item.sk
				})
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
