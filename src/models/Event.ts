export interface EventBridgeEvent {
	version: number;
	id: string;
	'detail-type': string;
	source: string;
	account: number;
	time: string;
	region: string;
	resources: Array<string>;
	detail: string;
}

export class Event {
	Detail: string;
	DetailType: string;
	Source: string;

	constructor(params: { Detail: object; DetailType: string; Source: string }) {
		(this.Detail = JSON.stringify(params.Detail)), (this.DetailType = params.DetailType), (this.Source = params.Source);
	}
}
