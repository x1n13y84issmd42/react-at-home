export function lognode(n?: Node) {
	if (! n) {
		return '<undefined>';
	}
 
	if (n.nodeType === Node.TEXT_NODE) {
		return `<${n.nodeName} "${n.nodeValue}">`;
    }

	const e = n as Element;

	function p(p: string, v?: string | null) {
		return v ? `${p}${v}`: undefined;
	}

	const label = [
		e.nodeName,
		p('#', e.id),
		p('@', e.getAttribute ? e.getAttribute('name') : undefined),
		...(e.classList?.values ? e.classList.values() : []).map(cl => p(`.`, cl)),
	].filter(v=>!!v).join('');

    return `<${label}>`;
}

export async function imap<T, R>(i: Iterable<T>, fn: (v: T) => Promise<R>, filter?: (v: T) => boolean): Promise<R[]> {
	const res: R[] = [];
	for (let v of i) {
		if (filter && filter(v) || !filter)
			res.push(await fn(v));
	}
	return res;
}

export type Keys<T extends object> = Extract<keyof T, 'string'>;

export function isAsync(fn: Function) {
	if (! (fn instanceof Function)) return false;

	const asyncRegex = /^\s*async\s+/;

	if (fn.toString().match(asyncRegex)) return true;

	return false;
}

let genidvalue = 1;

export function genid() {
	return 'g' + genidvalue++;
}

export function makeid(pieces: (string|undefined)[]) {
	return pieces.filter(p=>!!p).join('-');
}

export type IDGeneratorKeys<T = any> = {
	readonly [p in keyof T]: string;
};

export type IDGenerator<T = any> = IDGeneratorKeys<T> & {
	peek: any;
	reset: ()=>void;
};

export function IDGen<T = any>(): IDGenerator<T> {
	const readonly = {
		set: (_: any, p: string) => {throw new Error(`Cannot set IDs (tried to set ${p}).`)},
	};

	const getfmt = (o: any, p: string|symbol, inc: boolean) => {
		if (! (p in o)) {
			(o as any)[p] = 1;
		}

		const v = inc ? (o as any)[p]++ : (o as any)[p];

		return `${String(p)}${v}`;
	};

	return new Proxy({}, {
		...readonly,
		get: (o, p) => {
			if (p === 'peek') {
				return new Proxy(o, {...readonly, get: (o, p) => getfmt(o, p, false)});
			}

			return getfmt(o, p, true);
		},
	});
}