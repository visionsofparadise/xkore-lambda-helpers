import { FunctionProps, Function, Runtime } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export const masterFunction = (masterConfig: Pick<FunctionProps, 'code'>) => (
	scope: Construct,
	fnName: string,
	config?: Partial<FunctionProps>
) =>
	new Function(scope, `${fnName}Handler`, {
		runtime: Runtime.NODEJS_12_X,
		handler: `${fnName}.handler`,
		...masterConfig,
		...config
	});
