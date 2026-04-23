import { Context } from "../context";
import { I$, IEngine } from "../contracts";
export interface State {
    cond: boolean;
}
export declare function stateFn(state: State): Promise<{
    cond: boolean;
}>;
export declare function domFn(ctx: Context<State>, $: I$, engine: IEngine): Promise<import("..").Nodes | undefined>;
