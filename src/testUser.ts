import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { logger } from './logger';
import uDelay from 'udelay';

export interface ITestUser {
	userId: string;
	accessToken: string;
	idToken: string;
	refreshToken: string;
}

export const testUser = async (
	props: {
		cognito: CognitoIdentityServiceProvider;
		clientId: string;
		username: string;
		password: string;
		keepUser?: boolean;
	},
	fn: (user: ITestUser) => void
) => {
	const signUpResponse = await props.cognito
		.signUp({
			ClientId: props.clientId,
			Username: props.username,
			Password: props.password,
			UserAttributes: [
				{
					Name: 'email',
					Value: props.username
				}
			]
		})
		.promise();

	logger.info(signUpResponse);

	await uDelay(2000);

	const signInResponse = await props.cognito
		.initiateAuth({
			ClientId: props.clientId,
			AuthFlow: 'USER_PASSWORD_AUTH',
			AuthParameters: {
				USERNAME: props.username,
				PASSWORD: props.password
			}
		})
		.promise();

	logger.info(signInResponse);

	const user: ITestUser = {
		userId: signUpResponse.UserSub,
		accessToken: signInResponse.AuthenticationResult!.AccessToken!,
		idToken: signInResponse.AuthenticationResult!.IdToken!,
		refreshToken: signInResponse.AuthenticationResult!.RefreshToken!
	};

	const deleteUser = async () =>
		!props.keepUser &&
		(await props.cognito
			.deleteUser({
				AccessToken: user.accessToken
			})
			.promise());

	try {
		await fn(user);

		await deleteUser();
	} catch (error) {
		logger.info(error);

		await deleteUser();

		throw error;
	}
};
