import { LogGroup } from "./log";
export const computer = LogGroup.wrap(function (expression, ctx) {
    const argn = Object.keys(ctx.scope);
    const argv = argn.map(n => ctx.scope[n]);
    const f = new Function(...argn, `return ${expression}`).bind(ctx.state);
    const r = f(...argv);
    console.log(`COMPUTER SAYS {`, r, `}`);
    return r;
}, 'computer', e => `{ ${e} }`);
export class Computer {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    compute(expression) {
        return computer(expression, this.ctx);
    }
}
