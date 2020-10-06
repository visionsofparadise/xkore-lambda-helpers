import { CfnOutput, CfnOutputProps, Construct } from '@aws-cdk/core';

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
