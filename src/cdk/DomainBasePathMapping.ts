import { DomainName, BasePathMapping, DomainNameAttributes, BasePathMappingProps } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';

export class DomainBasePathMapping extends Construct {
	constructor(
		scope: Construct,
		id: string,
		props: DomainNameAttributes & Pick<BasePathMappingProps, 'basePath' | 'restApi'>
	) {
		super(scope, id);

		const domainName = DomainName.fromDomainNameAttributes(this, 'domain', {
			...props
		});

		new BasePathMapping(this, 'domainMapping', {
			...props,
			domainName
		});
	}
}
