import { ResolvedComponent } from "./contracts";
import { State } from "./state";
interface IContextDOM {
    vinst?: Element;
    inst?: Element;
    src?: Element;
    dummy?: Element;
    nodes: Node[];
    id: {
        [id: string]: Element;
    };
}
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
    constructor(state?: Tstate, scope?: Tscope);
    child(vinst: Element, stateEx?: Tstate, scopeEx?: Tscope): Context<Tstate, Tscope>;
    private merge;
    mergeState(extra: any): void;
    own(vinst: Element, inst?: Element, id?: string): void;
    static owned(e: Element): Context<any, any> | undefined;
    onRender(): void;
    onUpdate(): void;
    reset(): void;
    get needsRender(): boolean;
    get id(): string;
    get name(): string;
    cid(id: string): string;
}
export {};
