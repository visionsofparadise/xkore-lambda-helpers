import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { logger } from './logger';
import uDelay from 'udelay';
import { nanoid } from 'nanoid';
import axios, { AxiosInstance } from 'axios';

export interface ITestUser {
	userId: string;
	accessToken: string;
	idToken: string;
	refreshToken: string;
	cognitoClient: AxiosInstance;
}

export const testUser = async (
	props: {
		cognito: CognitoIdentityServiceProvider;
		clientId: string;
		clientBaseURL: string;
		keepUser?: boolean;
	},
	fn: (user: ITestUser) => void
) => {
	const username = `${nanoid()}@test.com`;
	const password = 'abcABC123!"£';

	const signUpResponse = await props.cognito
		.signUp({
			ClientId: props.clientId,
			Username: username,
			Password: password,
			UserAttributes: [
				{
					Name: 'email',
					Value: username
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
				USERNAME: username,
				PASSWORD: password
			}
		})
		.promise();

	logger.info(signInResponse);

	const cognitoClient = axios.create({
		baseURL: props.clientBaseURL,
		headers: {
			Authorization: signInResponse.AuthenticationResult!.IdToken!
		}
	});

	const user: ITestUser = {
		userId: signUpResponse.UserSub,
		accessToken: signInResponse.AuthenticationResult!.AccessToken!,
		idToken: signInResponse.AuthenticationResult!.IdToken!,
		refreshToken: signInResponse.AuthenticationResult!.RefreshToken!,
		cognitoClient
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
