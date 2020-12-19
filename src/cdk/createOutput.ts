import { CfnOutput, CfnOutputProps, Construct } from '@aws-cdk/core';

export const masterOutput = (scope: Construct, deploymentName: string) => (
	outputName: string,
	outputValue: string,
	config?: CfnOutputProps
) => createOutput(scope, deploymentName, outputName, outputValue, config);

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
