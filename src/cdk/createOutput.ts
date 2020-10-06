import { CfnOutput, CfnOutputProps } from '@aws-cdk/core/lib/cfn-output';
import { Construct } from '@aws-cdk/core/lib/construct-compat';

export const createOutput = (
	scope: Construct,
	deploymentName: string,
	outputName: string,
	outputValue: string,
	config?: CfnOutputProps
) =>
	new CfnOutput(
		scope,
		`${outputName}Output`,
		config
			? {
					...config,
					value: outputValue,
					exportName: deploymentName + `-${outputName}`
			  }
			: {
					value: outputValue,
					exportName: deploymentName + `-${outputName}`
			  }
	);
