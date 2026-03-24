import { Context } from "../context";
import { I$, IRAH } from "../contracts";

export interface State {
	error: Error;
}

export async function domFn(ctx: Context<State>, $: I$, rah: IRAH) {
	if (ctx.state.error) {
		const E = document.createElement('div');
		E.style.backgroundColor = 'red';
		E.style.color = 'white';

		E.appendChild(document.createTextNode(ctx.state.error.message));
		
		const stack = document.createElement('small');
		stack.style.whiteSpace = 'pre-wrap';
		stack.style.display = 'block';
		if (ctx.state.error.stack) {
			stack.appendChild(document.createTextNode(ctx.state.error.stack));
		}
		E.appendChild(stack);

		return [E];
	}
}
