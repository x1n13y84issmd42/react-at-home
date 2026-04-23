import { AttrMapFn, I$, NodeFilter, NodeMultiplexer, Nodes } from "./contracts";
export declare class DOM implements I$ {
    isHTMLTag(e: Node): boolean;
    replace(oldE: Node, newEs: Nodes): void;
    replace2(oldEs: Nodes, newEs: Nodes): void;
    clone(e: Node, attrMap?: AttrMapFn): Element;
    append(e: Node, children: Nodes, fn?: NodeMultiplexer, filter?: NodeFilter): Promise<void>;
    map(nodes: Nodes, fn: NodeMultiplexer, filter?: NodeFilter): Promise<Nodes>;
    createPlaceholder(id: string): HTMLTemplateElement;
}
