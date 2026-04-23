export declare const console_log: (...data: any[]) => void;
export declare function LogGroup(groupName: string, extra?: LogGroup.ExtraFn, opts?: LogGroup.Options): (target: any, prop: string, pd: PropertyDescriptor) => PropertyDescriptor;
export declare namespace LogGroup {
    type ExtraFn = (this: any, ...a: any[]) => string | string[];
    type Options = {
        collapsed?: boolean;
        rich?: boolean;
    };
    function wrap<T extends Function>(fn: T, groupName: string, extra?: ExtraFn, options?: Options): T;
}
