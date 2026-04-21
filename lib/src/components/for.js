;
;
export async function stateFn(state) {
    return {
        of: state.of || [],
    };
}
export async function domFn(ctx, $, engine) {
    if (!ctx.dom.vinst) {
        return;
    }
    const items = ctx.state.of;
    const res = [];
    for (let i in items) {
        ctx.scope.i = i;
        ctx.scope.item = items[i];
        res.push(...await $.map(ctx.dom.vinst.childNodes, cn => engine.transform(cn, ctx), engine.filter));
        delete ctx.scope.i;
        delete ctx.scope.item;
    }
    return res;
}
