import { Construct, Stack } from '@aws-cdk/core';
import { FunctionProps, Function } from '@aws-cdk/aws-lambda';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Documentation, IDocumentation } from '../Documentation';
import { Rule, RuleProps } from '@aws-cdk/aws-events';
import { Documented } from './DocumentationItems';

export interface RuleLambdaProps extends FunctionProps {
	RuleLambdaHandler: RuleLambda['RuleLambdaHandler'];
	source: string;
	tags?: Array<string>;
	eventPattern?: RuleProps['eventPattern'];
}

export class RuleLambda extends Function implements Documented {
	public RuleLambdaHandler: { tags?: Array<string>; detailType: Array<string>; detailJSONSchema: object };

	constructor(scope: Construct, id: string, props: RuleLambdaProps) {
		super(scope, id, props);

		this.RuleLambdaHandler = props.RuleLambdaHandler;

		if (props.tags) this.RuleLambdaHandler.tags = [...this.RuleLambdaHandler.tags!, ...props.tags];

		new Rule(this, `${id}Rule`, {
			eventPattern: {
				source: [props.source],
				detailType: this.RuleLambdaHandler.detailType,
				...props.eventPattern
			},
			targets: [new LambdaFunction(this)]
		});
	}

	public createDocumentation = (props: Pick<IDocumentation, 'service' | 'group'>) => {
		const stack = Stack.of(this);

		const jsonSchemas = [];

		if (this.RuleLambdaHandler.detailJSONSchema) {
			jsonSchemas.push(
				stack.toJsonString({
					value: this.RuleLambdaHandler.detailJSONSchema
				})
			);
		}

		return [
			new Documentation({
				...props,
				documentationName: this.node.id,
				type: 'rule',
				detailTypes: this.RuleLambdaHandler.detailType,
				jsonSchemas,
				tags: this.RuleLambdaHandler.tags
			}).data
		];
	};
}
