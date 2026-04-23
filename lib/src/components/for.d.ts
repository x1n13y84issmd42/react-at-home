import { Context } from "../context";
import { I$, IEngine } from "../contracts";
export interface State {
    of: unknown[];
}
export interface Scope {
    i?: string;
    item: unknown;
}
export declare function stateFn(state: State): Promise<{
    of: unknown[];
}>;
export declare function domFn(ctx: Context<State, Scope>, $: I$, engine: IEngine): Promise<Node[] | undefined>;
