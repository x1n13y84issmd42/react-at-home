export async function domFn(ctx, $, engine) {
    if (ctx.state.error) {
        const E = document.createElement('div');
        E.style.backgroundColor = 'red';
        E.style.color = 'white';
        const p1 = document.createElement('p');
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');
        p1.appendChild(document.createTextNode('Context: ' + ctx.state.ctxID + "\n"));
        p2.appendChild(document.createTextNode('Node: ' + ctx.state.nodeName + "\n"));
        p3.appendChild(document.createTextNode(ctx.state.error.message));
        E.appendChild(p1);
        E.appendChild(p2);
        E.appendChild(p3);
        const stack = document.createElement('small');
        stack.style.whiteSpace = 'pre-wrap';
        stack.style.display = 'block';
        if (ctx.state.error.stack) {
            stack.appendChild(document.createTextNode(ctx.state.error.stack));
        }
        E.appendChild(stack);
        return [E];
    }
}
