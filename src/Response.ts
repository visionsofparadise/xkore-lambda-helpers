import { logger } from './logger';

export interface IResponse {
	statusCode: number;
	body?: any;
	headers?: Required<{}>;
}

// interface DynamoDBError {
// 	statusCode: number;
// 	message: string
// }

// export const dynamoDBErrorMap = (error: DynamoDBError) => {

// }

export class Response implements IResponse {
	public statusCode: number;
	public body: any;
	public headers: Required<{}>;

	constructor(props: IResponse) {
		logger.info({ response: props });

		this.statusCode = props.statusCode;
		this.body = typeof props.body === 'string' ? props.body : JSON.stringify(props.body);
		this.headers = {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json',
			...props.headers
		};
	}
}

export const SUCCESS_200 = (body: any) => ({ statusCode: 200, body });
export const SUCCESS_NO_CONTENT_204 = { statusCode: 204 };
export const BAD_REQUEST_400 = (error: any) => ({ statusCode: 400, body: error });
export const UNAUTHORIZED_401 = { statusCode: 401, body: 'Unauthorized' };
export const NOT_FOUND_404 = { statusCode: 404, body: 'Item not found' };
