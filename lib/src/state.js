import { LogGroup } from "./log";
import { isAsync } from "./utility";
export var State;
(function (State) {
    class BoundElements {
        elements = new Set;
        ;
        contexts = new Set;
        ;
    }
    State.BoundElements = BoundElements;
    ;
    State.create = LogGroup.wrap(function (state = {}, ctx) {
        const hooks = {
            get: new Hook(),
            set: new Hook(),
        };
        const stash = {};
        function get(o, p) {
            ctx && console.log(`State.get (Context#${ctx.name}).${p}`);
            if (p === 'hooks') {
                return hooks;
            }
            else {
                stash[p] = stash[p] || new BoundElements();
                hooks.get.call(stash[p]);
                const res = o[p];
                return res;
            }
        }
        function set(o, p, v) {
            ctx && console.log(`State.set (Context#${ctx.name}).${p} = ${v}`);
            o[p] = v;
            stash[p] = stash[p] || new BoundElements();
            hooks.set.call(stash[p], p, v);
            return true;
        }
        return new Proxy({ ...state }, {
            get,
            set,
        });
    }, 'State.create');
    class Hook {
        handlers = [];
        call(bound, p, v) {
            if (this.handlers.length) {
                this.handlers[this.handlers.length - 1](bound, p, v);
            }
        }
        push(h) {
            this.handlers.push(h);
        }
        pop() {
            this.handlers.pop();
        }
        with(handler, fn) {
            if (isAsync(fn)) {
                return (async (h, f) => {
                    try {
                        this.push(h);
                        const r = await f();
                        return r;
                    }
                    finally {
                        this.pop();
                    }
                })(handler, fn);
            }
            else {
                return ((h, f) => {
                    try {
                        this.push(h);
                        const r = f();
                        return r;
                    }
                    finally {
                        this.pop();
                    }
                })(handler, fn);
            }
        }
        forElement(e, fn) {
            const handler = (bound) => {
                console.log(`Bounded the element`, e);
                bound.elements.add(e);
            };
            return this.with(handler, fn);
        }
        forContext(ctx, fn) {
            const handler = (bound) => {
                console.log(`Bounded the Context`, ctx);
                bound.contexts.add(ctx);
            };
            return this.with(handler, fn);
        }
    }
    State.Hook = Hook;
})(State || (State = {}));
