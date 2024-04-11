import { USERS_CHUNK_SIZE } from '../constants';
import request from './request';
import Client from '../client';

function chunk(arr, chunkSize) {
	const chunks = [];

	let len = arr.length;
	let i = 0;

	while (i < len) {
		chunks.push(arr.slice(i, i += chunkSize));
	}

	return chunks;
}

export default async function (...ids: string[]) {
	const users = new Array(ids.length);

	const chunks = chunk(ids, USERS_CHUNK_SIZE);

	for (const chunk of chunks) {
		const res = await request(() => Client.instance.v1.users({ user_id: chunk }));
		users.push(...res);
	}

	return users;
}