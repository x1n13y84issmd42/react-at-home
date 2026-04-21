import { Context } from "./context";
export declare const computer: (expression: string, ctx: Context<any, any>) => any;
export declare class Computer {
    protected ctx: Context;
    constructor(ctx: Context);
    compute(expression: string): any;
}
