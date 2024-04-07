import request from './request';
import Client from '../client';

export default async function (...ids: string[]) {
	return request(() => Client.instance.v1.users({ user_id: ids }));
}