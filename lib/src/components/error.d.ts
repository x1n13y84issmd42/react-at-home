import { Context } from "../context";
import { I$, IEngine } from "../contracts";
export interface State {
    nodeName: string;
    ctxID: string;
    error: Error;
}
export declare function domFn(ctx: Context<State>, $: I$, engine: IEngine): Promise<HTMLDivElement[] | undefined>;
