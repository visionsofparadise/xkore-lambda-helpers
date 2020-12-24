import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { JSONSchemaType } from 'ajv';
import { EventLambda, EventLambdaProps } from './EventLambda';
import { HttpLambda, HttpLambdaProps } from './HttpLambda';

export const masterLambda = (masterConfig: Pick<FunctionProps, 'code' | 'runtime'>) => {
	return {
		createLambda: (scope: Construct, id: string, config: Omit<FunctionProps, 'handler' | 'code' | 'runtime'>) =>
			new Function(scope, id, {
				...masterConfig,
				...config,
				handler: `${id}.handler`
			}),

		createHttpLambda: <
			Params extends object | undefined,
			Body extends object | undefined,
			Query extends object | undefined,
			Response extends object | undefined,
			Authorizer extends boolean | undefined
		>(
			scope: Construct,
			id: string,
			config: Omit<HttpLambdaProps<Params, Body, Query, Response, Authorizer>, 'handler' | 'code' | 'runtime'>
		) =>
			new HttpLambda(scope, id, {
				...masterConfig,
				...config,
				handler: `${id}.handler`
			}),

		initializeEventLambda: <
			DetailType extends string,
			Detail extends object,
			DetailJSONSchema = JSONSchemaType<Detail>
		>(
			source: string
		) => (
			scope: Construct,
			id: string,
			config: Omit<EventLambdaProps<DetailType, Detail, DetailJSONSchema>, 'code' | 'runtime' | 'source'>
		) =>
			new EventLambda(scope, id, {
				...masterConfig,
				...config,
				handler: `${id}.handler`,
				source
			})
	};
};
