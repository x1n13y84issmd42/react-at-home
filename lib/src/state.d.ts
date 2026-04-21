import { Context } from "./context";
export declare namespace State {
    type WithHooks<T> = T & {
        hooks: {
            get: State.Hook;
            set: State.Hook;
        };
    };
    const create: <T extends object = any>(state?: T, ctx?: Context) => WithHooks<T>;
    type HookHandler = (bound: Set<Context>, p?: any, v?: any) => void;
    class Hook {
        handlers: Function[];
        call(bound: Set<Context>, p?: any, v?: any): void;
        push(h: HookHandler): void;
        pop(): void;
        with(handler: HookHandler, fn: Function): any;
    }
}
