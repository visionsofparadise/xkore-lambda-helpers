import spawnLogger from 'envlog';

export const logger = spawnLogger({
	envKey: 'STAGE',
	offValue: 'prod'
});
