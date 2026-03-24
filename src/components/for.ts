import { Context } from "../context";
import { I$, IRAH, Nodes } from "../contracts";

export interface State {
	of: unknown[];
};

export interface Scope {
	i?: string;
	item: unknown;
};

export function stateFn(state: State) {
	return {
		of: state.of || [],
	};
}

export async function domFn(ctx: Context<State, Scope>, $: I$, rah: IRAH) {
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
			// (cn: Element) => rah.transform(cn, ctx.copy({}, {i, item: items[i]}, true, cn.id, true)),
			(cn: Element) => rah.transform(cn, ctx),
			rah.filter
		));

		delete ctx.scope.i;
		delete ctx.scope.item;
	}

	return res;
}
