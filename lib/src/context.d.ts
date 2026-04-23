import { ResolvedComponent, EngineElement } from "./contracts";
import { State } from "./state";
interface IContextDOM {
    vinst?: Element;
    inst?: EngineElement;
    src?: Element;
    dummy?: Element;
    nodes: Node[];
    id: {
        [id: string]: Element;
    };
}
export type AnyState = {
    [p: string]: any;
};
export type AsyncFn = () => Promise<void>;
export declare class Context<Tstate extends object = any, Tscope extends object = any> {
    readonly state: State.WithHooks<Tstate>;
    readonly scope: Tscope;
    dom: IContextDOM;
    rc?: ResolvedComponent;
    parent?: Context;
    protected _id: string;
    protected v: number;
    protected vr: number;
    protected idgen: import("./utility").IDGenerator<any>;
    protected children: Map<string, Context>;
    update?: AsyncFn;
    constructor(state?: Tstate, scope?: Tscope);
    child(vinst: Element, stateEx?: Tstate, scopeEx?: Tscope): Context<Tstate, Tscope>;
    private merge;
    mergeState(extra: any): void;
    own(vinst: Element, inst?: EngineElement, id?: string): void;
    static owned(e: Element): Context<any, any> | undefined;
    onRender(): void;
    onUpdate(): void;
    reset(): void;
    get needsRender(): boolean;
    get id(): string;
    get name(): string;
}
export {};
