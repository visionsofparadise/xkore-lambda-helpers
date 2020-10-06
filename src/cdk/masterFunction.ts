import { FunctionProps, Function, Runtime } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export const masterFunction = (masterConfig: Pick<FunctionProps, 'code'>) => (
	scope: Construct,
	fnName: string,
	handlerName?: string,
	config?: Partial<FunctionProps>
) =>
	new Function(scope, `${fnName}${handlerName || 'Handler'}`, {
		runtime: Runtime.NODEJS_12_X,
		handler: `${fnName}.${handlerName || 'handler'}`,
		...masterConfig,
		...config
	});
