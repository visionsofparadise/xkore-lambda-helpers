import { Function, FunctionProps } from '@aws-cdk/aws-lambda/lib/function';
import { Runtime } from '@aws-cdk/aws-lambda/lib/runtime';
import { Construct } from '@aws-cdk/core/lib/construct-compat';

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
