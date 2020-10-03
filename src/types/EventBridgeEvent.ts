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
