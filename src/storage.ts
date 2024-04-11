import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class Storage {
	path = join(__dirname, '..', 'state.json');
	state = {};

	constructor() {
		if (existsSync(this.path)) {
			const content = readFileSync(this.path, 'utf-8');
			const json = JSON.parse(content);

			this.state = json;
		}
	}

	compare(username: string, newList: string[]) {
		if (!this.state[username]) {
			return [];
		}

		const current = this.get(username);

		return newList.filter(x => !current.includes(x));
	}

	set(username: string, followers: string[]) {
		this.state[username] = followers;
		this.save();
	}

	get(username: string) {
		return this.state[username] ?? [];
	}

	setOptimalRatelimitResetLength(length: number) {
		this.state['$$ratelimit'] = length;
		this.save();
	}

	getOptimalRatelimitResetLength() {
		return this.state['$$ratelimit'] ?? 0;
	}

	setOptimalRatelimitRemaining(length: number) {
		this.state['$$ratelimitMaxRemaining'] = length;
		this.save();
	}

	getOptimalRatelimitRemaining() {
		return this.state['$$ratelimitMaxRemaining'] ?? 160;
	}

	getRatelimitReset() {
		return this.state['$$ratelimitReset'] ?? 0;
	}

	setRatelimitReset(length: number) {
		this.state['$$ratelimitReset'] = length;
		this.save();
	}

	getLastRatelimited() {
		return this.state['$$ratelimitLast'] ?? Date.now();
	}

	setLastRatelimited(length: number) {
		this.state['$$ratelimitLast'] = length;
		this.save();
	}


	save() {
		const content = JSON.stringify(this.state, null, 2);
		writeFileSync(this.path, content, 'utf-8');
	}
}

export default Storage;