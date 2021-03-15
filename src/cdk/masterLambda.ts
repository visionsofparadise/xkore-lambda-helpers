import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
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

		initializeHttpLambda: (urlList: HttpLambdaProps['urlList']) => (
			scope: Construct,
			id: string,
			config: Omit<HttpLambdaProps, 'handler' | 'code' | 'runtime' | 'urlList'>
		) =>
			new HttpLambda(scope, id, {
				...masterConfig,
				...config,
				urlList,
				handler: `${id}.handler`
			}),

		initializeEventLambda: (source: string) => (
			scope: Construct,
			id: string,
			config: Omit<EventLambdaProps, 'handler' | 'code' | 'runtime' | 'source'>
		) =>
			new EventLambda(scope, id, {
				...masterConfig,
				...config,
				handler: `${id}.handler`,
				source
			})
	};
};
