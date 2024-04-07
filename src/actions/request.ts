import { ApiResponseError } from 'twitter-api-v2';
import sleep from './sleep';

async function request<T>(callback: () => T | Promise<T>) {
	while (true) {
		try {
			return await callback();
		} catch (error) {
			if (error instanceof ApiResponseError && error.rateLimit) {
				const ms = error.rateLimit.reset * 1000;
				const timeout = ms - Date.now();

				console.warn(`Encountered ratelimit. Waiting for ${timeout}ms (until ${new Date(ms)})`);

				await sleep(timeout);
				continue;
			}

			throw error;
		}
	}
}

export default request;