import spawnLogger from 'envlog';

export const logger = spawnLogger({
	envKey: 'XLH_LOGS',
	offValue: 'prod'
});
