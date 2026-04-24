import { Context } from './context';
import { DOMFn, EngineElement, IEngine, NeedsDOMUpdateFn, Nodes, OnRenderFn, RegisteredComponent, ResolvedComponent, StateFn } from './contracts';
import { DOM } from './DOM';
import { State } from './state';
export declare class Engine implements IEngine {
    private $;
    protected registry: Record<string, RegisteredComponent>;
    protected onRenderStash: Function[];
    constructor($?: DOM);
    onRender(): void;
    register(compName: string, stateFn?: StateFn, domFn?: DOMFn, onRenderFn?: OnRenderFn, needsDOMUpdateFn?: NeedsDOMUpdateFn): void;
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
    protected queue2: Function[];
    onStateUpdate(bound: State.BoundElements): void;
    render(vinst: Element, ctx?: Context<Record<string, any>>): Promise<void>;
}
