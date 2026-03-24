import { Context } from "./context";
import { LogGroup } from "./log";

export const computer = LogGroup.wrap(function(expression: string, ctx: Context<any, any>) {
	// ctx.scope props become named arguments.
	const argn = Object.keys(ctx.scope);
	const argv = argn.map(n => ctx.scope[n]);

	// ctx.state becomes a Proxy to hook to state prop access from within components.
	const f = new Function(...argn, `return ${expression}`).bind(ctx.state);
	const r = f(...argv);
	console.log(`COMPUTER SAYS {`, r, `}`);
	return r;
}, 'computer', e => `{ ${e} }`);

export class Computer {
	constructor(protected ctx: Context) {}

	compute(expression: string): any {
		return computer(expression, this.ctx);
	}
}
