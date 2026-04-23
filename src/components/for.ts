import { Context } from "../context";
import { I$, IEngine, Nodes } from "../contracts";

export interface State {
	of: unknown[];
};

export interface Scope {
	i?: string;
	item: unknown;
};

export async function stateFn(state: State) {
	state.of = state.of || [];
}

export async function domFn(ctx: Context<State, Scope>, $: I$, engine: IEngine) {
	if (! ctx.dom.vinst) {
		return;
	}

	const items = ctx.state.of;

	const res: Node[] = [];

	for (let i in items) {
		ctx.scope.i = i;
		ctx.scope.item = items[i];

		res.push(...await $.map(
			ctx.dom.vinst.childNodes,
			cn => engine.transform(cn, ctx),
			engine.filter
		));

		delete ctx.scope.i;
		delete ctx.scope.item;
	}

	return res;
}
