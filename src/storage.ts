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

	save() {
		const content = JSON.stringify(this.state, null, 2);
		writeFileSync(this.path, content, 'utf-8');
	}
}

export default Storage;