interface LoggerConfig {
	envKey: string;
	onValue?: string;
	offValue?: string;
}

export class Logger {
	config: LoggerConfig;

	constructor(config: LoggerConfig) {
		this.config = config;
	}

	logCondition = () =>
		(this.config.onValue &&
			process.env[this.config.envKey] &&
			process.env[this.config.envKey] === this.config.onValue) ||
		(this.config.offValue &&
			process.env[this.config.envKey] &&
			process.env[this.config.envKey] !== this.config.offValue);

	log = (data: any) => this.logCondition() && console.log(data);
	info = (data: any) => this.logCondition() && console.info(data);
	error = (data: any) => this.logCondition() && console.error(data);
}

export const xlhLogger = new Logger({
	envKey: 'XLH_LOGS',
	onValue: 'true'
});
