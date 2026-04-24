import { Context } from "./context";

export type AttrMapFn = (n: string, v: string) => any;

export type Nodes = Iterable<Node> & {length: number};

export interface I$ {
	replace(oldE: Node, newEs: Nodes): void;
    clone(e: Node, attrMap?: AttrMapFn): Node;
	append(e: Node, children: Nodes, fn?: NodeMultiplexer): Promise<void>;
	map(nodes: Nodes, fn: NodeMultiplexer, filter?: NodeFilter): Promise<Nodes>;
}

export type StateFn<TS extends object = any> = (state: TS)=>Promise<any>;
export type DOMFn = (ctx: Context, $: I$, engine: IEngine)=>Promise<Nodes | undefined>;
export type OnRenderFn = (ctx: Context)=>Promise<void>;
export type NeedsDOMUpdateFn = (ctx: Context)=>()=>boolean;

export type RegisteredComponent = {
    stateFn?: StateFn;
    domFn?: DOMFn;
    onRenderFn?: OnRenderFn;
    needsDOMUpdateFn?: NeedsDOMUpdateFn;
};

export interface ResolvedComponent extends RegisteredComponent {
	src: Element;
}

export type NodeMultiplexer = (n: Node) => Promise<Nodes>;
export type NodeFilter = (n: Node) => boolean;

export interface IEngine {
	transform(instE: Node, ctx: Context): Promise<Nodes>;
	filter(vinst: Node): boolean;
}

export interface EngineElement extends Element {
	_engine_: {
		ctx?: Context;
		update: Function;
	};
}
