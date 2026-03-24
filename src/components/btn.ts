import { Context } from "../context";
import { I$, IRAH, Nodes } from "../contracts";

export interface State {
	value: string;
}

export function stateFn(state: State) {
	return {
		value: state.value || ''
	};
}

export async function domFn(ctx: Context<State>, $: I$, rah: IRAH): Promise<Nodes> {
	return [];
}
