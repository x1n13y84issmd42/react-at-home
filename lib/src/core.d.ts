import { Context } from './context';
import { DOMFn, IEngine, Nodes, OnRenderFn, ResolvedComponent, StateFn } from './contracts';
import { DOM } from './DOM';
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
    bindContext(ctx: Context): (bc: Set<Context>) => void;
    create(compName: string, ctx: Context): Promise<Nodes>;
    getAttrFn(ctx: Context): (an: string, av: string) => any;
    clone(vinst: Node, ctx: Context): Promise<Element>;
    filter(vinst: Node): boolean;
    transform(vinst: Node, ctx: Context): Promise<Nodes>;
    updateCtx(ctx: Context): Promise<Nodes>;
    update(ctx: Context): Promise<void>;
    protected queue: Set<Context<any, any>>;
    render(vinst: Element, ctx?: Context<Record<string, any>>): Promise<void>;
}
export {};
