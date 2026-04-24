export async function stateFn(state) {
    state.cond = !!state.cond;
}
export async function domFn(ctx, $, engine) {
    if (ctx.state.cond && ctx.dom.vinst) {
        return await $.map(ctx.dom.vinst.childNodes, async (n) => await engine.transform(n, ctx));
    }
}
export function needsDOMUpdate(ctx) {
    console.log(`<IF> needsDOMUpdate`);
    let lastCond = ctx.state.cond;
    return function () {
        console.log(`<IF> Needs update?`);
        const needs = lastCond != ctx.state.cond;
        lastCond = ctx.state.cond;
        return needs;
    };
}
