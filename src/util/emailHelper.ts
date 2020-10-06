import SESV2 from 'aws-sdk/clients/sesv2';
import { logger } from '../logger';

export const createEmailHelper = (params: { ses: SESV2; from: string }) => ({
	send: async ({ email, subject, message }: { email: string; subject: string; message: string }) => {
		logger.log({ email, subject, message });

		return params.ses
			.sendEmail({
				FromEmailAddress: params.from,
				Destination: {
					ToAddresses: [email]
				},
				Content: {
					Simple: {
						Subject: {
							Charset: 'UTF-8',
							Data: subject
						},
						Body: {
							Html: {
								Charset: 'UTF-8',
								Data: message
							},
							Text: {
								Charset: 'UTF-8',
								Data: message
							}
						}
					}
				}
			})
			.promise();
	}
});
