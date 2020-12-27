import axios from 'axios';
import { ITestUser } from './testUser';

export const testUser = async (user: ITestUser, props: { apiKeyCreateURL: string; clientBaseURL: string }) => {
	const response = await axios.post<{ apiKey: string }>(props.apiKeyCreateURL, undefined, {
		headers: {
			Authorization: user.idToken
		}
	});

	const apiKey = response.data.apiKey;

	const apiKeyClient = axios.create({
		baseURL: props.clientBaseURL,
		headers: {
			Authorization: apiKey
		}
	});

	return {
		apiKey,
		apiKeyClient
	};
};
