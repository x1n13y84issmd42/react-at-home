import { Context } from "../context";
import { I$, IEngine } from "../contracts";

export interface State {
	cond: boolean;
}

export async function stateFn(state: State) {
	return {
		cond: !!state.cond
	};
}

export async function domFn(ctx: Context<State>, $: I$, engine: IEngine) {
	if (ctx.state.cond && ctx.dom.vinst) {
		return await $.map(ctx.dom.vinst.childNodes, async n => await engine.transform(n, ctx));
	}
}
