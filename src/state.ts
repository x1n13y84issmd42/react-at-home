import { Context } from "./context";
import { LogGroup } from "./log";
import { isAsync, Keys } from "./utility";

export namespace State {
	export type WithHooks<T> = T & {hooks: {get: State.Hook; set: State.Hook;}};

	export const create = LogGroup.wrap(function <T extends object = any>(state: T = {} as T, ctx?: Context): WithHooks<T> {
		const hooks = {
			get: new Hook(),
			set: new Hook(),
		};

		type BoundContexts = { [p in Keys<T>]: Set<Context> }; 
		const stash: BoundContexts = {} as BoundContexts;

		//TODO: this proxy usage needs to be revised both design- & performance-wise.
		function get(o: T, p: Keys<T> | 'hooks'): any {
			// ctx && console.log(`Context#${ctx.name}`);

			if (p === 'hooks') {
				return hooks;
			} else {
				stash[p] = stash[p] || new Set<Context>();
				hooks.get.call(stash[p]);
				const res = o[p];
				// console.log(p, '=', res);
				return res;
			}
		}
	
		function set(o: T, p: Keys<T>, val: T[Keys<T>]): boolean {
			ctx && console.log(`Context#${ctx.name}`);

			o[p] = val;
			stash[p] = stash[p] || new Set<Context>();
			hooks.set.call(stash[p], p, val);
			return true;
		}

		return new Proxy<T>(
			{...state},
			{
				// get: LogGroup.wrap(get, `[] Proxy get()`, (_, p) => p, {collapsed: true}),
				// set: LogGroup.wrap(set, `[] Proxy set()`, (_, p, v) => `${p}=${v}`, {collapsed: true}),
				get,
				set,
			},
		) as WithHooks<T>;
	}, 'State.create');

	export type HookHandler = (bound: Set<Context>, p?: any, v?: any) => void;

	export class Hook {
		public handlers: Function[] = [];

		// @LogGroup('Hook.call()')
		call(bound: Set<Context>, p?: any, v?: any) {
			if (this.handlers.length) {
				this.handlers[this.handlers.length - 1](bound, p, v);
			}
		}

		push(h: HookHandler) {
			this.handlers.push(h);
		}
		
		pop() {
			this.handlers.pop();
		}

		with(handler: HookHandler, fn: Function) {
			if(isAsync(fn)) {
				return (async (h: HookHandler, f: Function) => {
					try {
						this.push(h);
						const r = await f();
						return r;
					} finally {
						this.pop();
					}
				})(handler, fn);
			} else {
				return ((h: HookHandler, f: Function) => {
					try {
						this.push(h);
						const r = f();
						return r;
					} finally {
						this.pop();
					}
				})(handler, fn);
			}
		}
	}
}
