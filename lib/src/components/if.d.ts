import { Context } from "../context";
import { I$, IEngine } from "../contracts";
export interface State {
    cond: boolean;
}
export declare function stateFn(state: State): Promise<void>;
export declare function domFn(ctx: Context<State>, $: I$, engine: IEngine): Promise<import("..").Nodes | undefined>;
export declare function needsDOMUpdate(ctx: Context<State>): () => boolean;
