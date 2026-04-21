import { LogGroup } from "./log";
import { isAsync } from "./utility";
export var State;
(function (State) {
    State.create = LogGroup.wrap(function (state = {}, ctx) {
        const hooks = {
            get: new Hook(),
            set: new Hook(),
        };
        const stash = {};
        function get(o, p) {
            if (p === 'hooks') {
                return hooks;
            }
            else {
                stash[p] = stash[p] || new Set();
                hooks.get.call(stash[p]);
                const res = o[p];
                return res;
            }
        }
        function set(o, p, val) {
            ctx && console.log(`Context#${ctx.name}`);
            o[p] = val;
            stash[p] = stash[p] || new Set();
            hooks.set.call(stash[p], p, val);
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
    }
    State.Hook = Hook;
})(State || (State = {}));
