import { isAsync } from "./utility";

export const console_log = console.log;

export function LogGroup(groupName: string, extra?: LogGroup.ExtraFn, opts?: LogGroup.Options) {
	return (target: any, prop: string, pd: PropertyDescriptor) => {
		pd.value = LogGroup.wrap(pd.value, groupName, extra, opts);
		return pd;
	};
}

export namespace LogGroup {
	export type ExtraFn = (this: any, ...a: any[]) => string | string[];
	export type Options = {
		collapsed?: boolean,
		rich?: boolean
	};

	export function wrap<T extends Function>(fn: T, groupName: string, extra?: ExtraFn, options?: Options): T {
		// return fn;

		// console.dir({fn});

		type Opened = ReturnType<typeof _open>;

		if (isAsync(fn)) {
			return async function(this: any, ...args: any[]) {
				let opened!: Opened;
				try {
					opened = _open(this, args, '*');
					return await fn.apply(this, args);
				} catch (err) {
					_catch(err);
				} finally {
					_close(opened);
				}
			} as unknown as T;
		} else {
			return function(this: any, ...args: any[]) {
				let opened!: Opened;
				try {
					opened =_open(this, args);
					return fn.apply(this, args);
				} catch (err) {
					_catch(err);
				} finally {
					_close(opened);
				}
			} as unknown as T;
		}

		function _open(_this: any, args: any[], postfix: string = '') {
			//TODO: _this isn't really getting to extra()
			let extraLogData = extra?.apply(_this, args) || [];
			if (!Array.isArray(extraLogData)) {
				extraLogData = [extraLogData];
			}

			if (options?.collapsed)
				console.groupCollapsed(groupName + ' ' + postfix, ...extraLogData);
			else
				console.group(groupName + ' ' + postfix, ...extraLogData);
			
			return {
				t0: Date.now(),
			};
		}
		
		function _close(opened: Opened) {
			if (options?.rich) {
				console.groupCollapsed('.');
				const t = Date.now() - opened.t0;
				console.log(`t=${t} ms`);
				console.groupEnd();
			}
			
			console.log('//' + groupName);
			console.groupEnd();
		}

		function _catch(err: unknown) {
			console.error(groupName);
			console.error(err);
			throw err;
		}
	}
}
