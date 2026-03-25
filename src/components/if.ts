import { Context } from "../context";
import { I$, IRAH } from "../contracts";

export interface State {
	cond: boolean;
}

export async function stateFn(state: State) {
	return {
		cond: !!state.cond
	};
}

export async function domFn(ctx: Context<State>, $: I$, rah: IRAH) {
	if (ctx.state.cond && ctx.dom.vinst) {
		return await $.map(ctx.dom.vinst.childNodes, async n => await rah.transform(n, ctx));
	}
}
