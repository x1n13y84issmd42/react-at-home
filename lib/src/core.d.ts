import { Context } from './context';
import { DOMFn, EngineElement, IEngine, Nodes, OnRenderFn, ResolvedComponent, StateFn } from './contracts';
import { DOM } from './DOM';
import { State } from './state';
type RegisteredComponent = {
    stateFn?: StateFn;
    domFn?: DOMFn;
    onRenderFn?: OnRenderFn;
};
export declare class Engine implements IEngine {
    private $;
    protected registry: Record<string, RegisteredComponent>;
    protected onRenderStash: Function[];
    constructor($?: DOM);
    onRender(): void;
    register(compName: string, stateFn?: StateFn, domFn?: DOMFn, onRenderFn?: OnRenderFn): void;
    resolve(compName: string): ResolvedComponent | undefined;
    instantiate(vinst: Element, parentCtx?: Context, instCtx?: Context): Promise<Nodes>;
    create(compName: string, ctx: Context, comp?: ResolvedComponent): Promise<Nodes>;
    getAttrFn(ctx: Context): (an: string, av: string) => any;
    clone(vinst: Node, ctx: Context): Promise<EngineElement>;
    compute(inst: Element, src: Element, ctx: Context): void;
    filter(vinst: Node): boolean;
    transform(vinst: Node, ctx: Context): Promise<Nodes>;
    updateCtx(ctx: Context): Promise<Nodes>;
    update(ctx: Context): Promise<void>;
    protected queue: Set<Context<any, any>>;
    onStateUpdate(bound: State.BoundElements): void;
    render(vinst: Element, ctx?: Context<Record<string, any>>): Promise<void>;
}
export {};
