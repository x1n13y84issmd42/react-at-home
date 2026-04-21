export function lognode(n) {
    if (!n) {
        return '<undefined>';
    }
    if (n.nodeType === Node.TEXT_NODE) {
        return `<${n.nodeName} "${n.nodeValue}">`;
    }
    const e = n;
    function p(p, v) {
        return v ? `${p}${v}` : undefined;
    }
    const label = [
        e.nodeName,
        p('#', e.id),
        p('@', e.getAttribute ? e.getAttribute('name') : undefined),
        ...(e.classList?.values ? e.classList.values() : []).map(cl => p(`.`, cl)),
    ].filter(v => !!v).join('');
    return `<${label}>`;
}
export async function imap(i, fn, filter) {
    const res = [];
    for (let v of i) {
        if (filter && filter(v) || !filter)
            res.push(await fn(v));
    }
    return res;
}
export function isAsync(fn) {
    if (!(fn instanceof Function))
        return false;
    const asyncRegex = /^\s*async\s+/;
    if (fn.toString().match(asyncRegex))
        return true;
    return false;
}
let genidvalue = 1;
export function genid() {
    return 'g' + genidvalue++;
}
export function makeid(pieces) {
    return pieces.filter(p => !!p).join('-');
}
export function IDGen() {
    const readonly = {
        set: (_, p) => { throw new Error(`Cannot set IDs (tried to set ${p}).`); },
    };
    const getfmt = (o, p, inc) => {
        if (!(p in o)) {
            o[p] = 1;
        }
        const v = inc ? o[p]++ : o[p];
        return `${String(p)}${v}`;
    };
    return new Proxy({}, {
        ...readonly,
        get: (o, p) => {
            if (p === 'peek') {
                return new Proxy(o, { ...readonly, get: (o, p) => getfmt(o, p, false) });
            }
            return getfmt(o, p, true);
        },
    });
}
