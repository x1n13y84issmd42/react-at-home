import { Context } from "./context";
import { EngineElement } from "./contracts";
export declare namespace State {
    type WithHooks<T> = T & {
        hooks: {
            get: State.Hook;
            set: State.Hook;
        };
    };
    class BoundElements {
        elements: Set<EngineElement>;
        contexts: Set<Context>;
    }
    const create: <T extends object = any>(state?: T, ctx?: Context) => WithHooks<T>;
    type HookHandler = (bound: BoundElements, p?: any, v?: any) => void;
    class Hook {
        handlers: Function[];
        call(bound: BoundElements, p?: any, v?: any): void;
        push(h: HookHandler): void;
        pop(): void;
        with(handler: HookHandler, fn: Function): any;
        forElement(e: EngineElement, fn: Function): any;
        forContext(ctx: Context, fn: Function): any;
    }
}
