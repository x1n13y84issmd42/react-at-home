export async function stateFn(state) {
    return {
        cond: !!state.cond
    };
}
export async function domFn(ctx, $, engine) {
    if (ctx.state.cond && ctx.dom.vinst) {
        return await $.map(ctx.dom.vinst.childNodes, async (n) => await engine.transform(n, ctx));
    }
}
