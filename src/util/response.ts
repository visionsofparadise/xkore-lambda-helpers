import { xlhLogger } from './logger';

interface Params {
	statusCode: number;
	body?: any;
	headers?: Required<{}>;
}

export interface Response {
	statusCode: number;
	body: any;
	headers: Required<{}>;
}

export const response = ({ statusCode, body, headers }: Params): Response => {
	const response = {
		statusCode,
		body: typeof body === 'string' ? body : JSON.stringify(body),
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json',
			...headers
		}
	};

	statusCode < 400 ? xlhLogger.log(response) : xlhLogger.log(response);

	return response;
};

export const SUCCESS_200 = (body: any) => ({ statusCode: 200, body });
export const SUCCESS_NO_CONTENT_204 = { statusCode: 204 };
export const BAD_REQUEST_400 = (error: any) => ({ statusCode: 400, body: error });
export const UNAUTHORIZED_401 = { statusCode: 401, body: 'Unauthorized' };
export const NOT_FOUND_404 = { statusCode: 404, body: 'Resource not found' };
