var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Context } from './context';
import { computer } from './data';
import * as datafn from './datafn';
import { DOM } from './DOM';
import { console_log, LogGroup } from './log';
import { lognode } from './utility';
import { handlers } from "./handlers";
export class Engine {
    $;
    registry = {};
    onRenderStash = [];
    constructor($ = new DOM()) {
        this.$ = $;
    }
    onRender() {
        console.log(`Having ${this.onRenderStash.length} onRender callbacks.`);
        for (let fn of this.onRenderStash) {
            fn();
        }
    }
    register(compName, stateFn, domFn, onRenderFn) {
        this.registry[compName.toLowerCase()] = {
            stateFn,
            domFn,
            onRenderFn,
        };
    }
    resolve(compName) {
        compName = compName.toLowerCase();
        const rc = {
            src: document.querySelectorAll(`component\\:${compName}`).item(0),
            ...(this.registry[compName] || {}),
        };
        if (rc.src || rc.domFn) {
            return rc;
        }
        return undefined;
    }
    async instantiate(vinst, parentCtx, instCtx) {
        if (!parentCtx) {
            throw new Error(`Missing parent Context.`);
        }
        if (!instCtx) {
            instCtx = parentCtx.child(vinst);
            instCtx.reset();
        }
        if (!instCtx.needsRender) {
            console.log(`Just instantiated & up to date.`);
            return instCtx.dom.nodes;
        }
        instCtx.dom.nodes = [];
        const instState = {};
        instCtx.state.hooks.set.push(this.onStateUpdate.bind(this));
        const comp = this.resolve(vinst.nodeName);
        instCtx.update = async () => {
            const attrFn = this.getAttrFn(parentCtx);
            for (let a of vinst.attributes) {
                instState[a.name] = attrFn(a.name, a.value);
            }
            instCtx.mergeState(instState);
        };
        parentCtx.state.hooks.get.forContext(instCtx, () => {
            instCtx.update && instCtx.update();
        });
        const nodes = await this.create(vinst.nodeName, instCtx, comp);
        console.log(`Rendered.`, instCtx.dom.nodes);
        instCtx.onRender();
        return nodes;
    }
    async create(compName, ctx, comp) {
        comp = comp || await this.resolve(compName);
        let created = true;
        if (comp) {
            ctx.dom.nodes = [];
            if (comp.stateFn) {
                const stateFn = LogGroup.wrap(comp.stateFn, 'stateFn()', undefined, { collapsed: true });
                await stateFn(ctx.state);
                const prevUpdate = ctx.update || (async () => { });
                ctx.update = async () => {
                    prevUpdate();
                    await stateFn(ctx.state);
                };
            }
            if (comp.src) {
                ctx.dom.src = comp.src;
                const nodes = await this.$.map(comp.src.childNodes, cn => this.transform(cn, ctx), this.filter);
                ctx.dom.nodes.push(...nodes);
            }
            if (comp.domFn) {
                const domFn = LogGroup.wrap(comp.domFn, 'domFn()');
                ctx.dom.nodes.push(...(await domFn(ctx, this.$, this) || []));
                console.log(`After domFn(): ${ctx.dom.nodes.length} child nodes`);
                if (!ctx.dom.nodes.length) {
                    ctx.dom.nodes = [this.$.createPlaceholder(ctx.id)];
                    created = false;
                }
            }
            if (created && comp.onRenderFn) {
                this.onRenderStash.push(() => comp.onRenderFn && comp.onRenderFn(ctx));
            }
            return ctx.dom.nodes;
        }
        throw new Error(`Component <${compName}> is unknown.`);
    }
    getAttrFn(ctx) {
        return LogGroup.wrap((an, av) => {
            const fn = {
                'id': datafn.id,
            }[an] || datafn.compute(ctx);
            const res = fn(av);
            console.log(an, '=', res);
            return res;
        }, 'attrFn', (n, v) => `(${n}, ${v})`, { collapsed: true });
    }
    async clone(vinst, ctx) {
        const inst = this.$.clone(vinst, this.getAttrFn(ctx));
        inst._engine_ = {
            ctx,
            update: () => this.compute(inst, vinst, ctx),
        };
        return await ctx.state.hooks.get.forElement(inst, async () => {
            inst._engine_.update();
            if (inst.nodeType !== Node.TEXT_NODE) {
                const instID = inst.getAttribute('id');
                if (instID) {
                    ctx.dom.id[instID] = inst;
                }
                if (vinst.childNodes.length) {
                    await this.$.append(inst, vinst.childNodes, cn => this.transform(cn, ctx), this.filter);
                }
            }
            return inst;
        });
    }
    compute(inst, src, ctx) {
        if (inst.nodeType === Node.TEXT_NODE) {
            inst.nodeValue = computer(src.nodeValue || '', ctx);
        }
        const attrMap = this.getAttrFn(ctx);
        if (src.attributes) {
            for (let a of src.attributes) {
                const av = attrMap(a.name, a.value);
                if (av === undefined) {
                    console.log(`Skipping attribute "${a.name}" due to undefined value.`);
                    continue;
                }
                if (av instanceof Function) {
                    let match = a.name.match(/^on(.*)/i);
                    if (match) {
                        if (match[1] in handlers) {
                            inst.addEventListener(match[1], handlers[match[1]](av));
                        }
                        else {
                            console.warn(`Unknown event handler ${a.name}.`);
                            inst.addEventListener(match[1], handlers.generic(av));
                        }
                        console.log(`+ "${match[1]}" event handler`);
                        continue;
                    }
                    else {
                        console.warn(`Unexpected function value attribute ${a.name}. Skipping it.`);
                        continue;
                    }
                }
                inst.setAttribute(a.name, av);
            }
        }
    }
    filter(vinst) {
        if (vinst.nodeType === Node.TEXT_NODE && (vinst.nodeValue || '').trim().length === 0) {
            return false;
        }
        if (vinst.nodeType === Node.COMMENT_NODE) {
            return false;
        }
        return true;
    }
    async transform(vinst, ctx) {
        try {
            if (!this.filter(vinst)) {
                return [];
            }
            if (this.$.isHTMLTag(vinst)) {
                return [await this.clone(vinst, ctx)];
            }
            return await this.instantiate(vinst, ctx);
        }
        catch (err) {
            return await this.create('error', new Context({ error: err, nodeName: vinst.nodeName, ctxID: ctx.id }));
        }
    }
    async updateCtx(ctx) {
        console.dir(ctx);
        try {
            ctx.reset();
            if (ctx.dom.vinst && this.$.isHTMLTag(ctx.dom.vinst)) {
                ctx.dom.inst = await this.clone(ctx.dom.vinst, ctx);
                return [ctx.dom.inst];
            }
            return await this.instantiate(ctx.dom.vinst, ctx.parent, ctx);
        }
        catch (err) {
            console.error('** updateCtx ERROR', err, ctx);
            return [];
        }
    }
    async update(ctx) {
        if (!ctx.needsRender) {
            console.log(`Already rendered.`);
            return;
        }
        if (ctx.dom.inst) {
            console.dir('"inst" case');
            const inst = ctx.dom.inst;
            this.$.replace(inst, await this.updateCtx(ctx));
        }
        else {
            console.dir('"nodes" case');
            const nodes = ctx.dom.nodes;
            this.$.replace2(nodes, await this.updateCtx(ctx));
        }
        ctx.onRender();
    }
    queue = new Set;
    onStateUpdate(bound) {
        for (const ctx of bound.contexts) {
            console.log(`Updating context`, ctx.id);
            ctx.onUpdate();
            ctx.update && ctx.update();
        }
        for (const e of bound.elements) {
            console.log(`Updating element`, lognode(e));
            e._engine_.update();
        }
        console.log(`Queue ${bound.contexts.size} ctxs, now having ${this.queue.size}`);
    }
    async render(vinst, ctx) {
        this.onRenderStash = [];
        if (!vinst) {
            throw new Error(`No element virtual instance was specified. Aborting.`);
        }
        let updating = false;
        ctx = ctx ? ctx.child(vinst, ctx.state, ctx.scope) : new Context();
        ctx.state.hooks.set.push(this.onStateUpdate.bind(this));
        this.$.replace(vinst, await this.transform(vinst, ctx));
        this.onRender();
        const update = async () => {
            this.onRenderStash = [];
            const rafr = () => requestAnimationFrame(update);
            if (this.queue.size < 1)
                return rafr();
            if (updating)
                return rafr();
            await LogGroup.wrap(async () => {
                updating = true;
                const t0 = Date.now();
                try {
                    const q = [...this.queue];
                    this.queue.clear();
                    console.log(`Having ${q.length} contexts to update...`);
                    for (let c of q) {
                        await this.update(c);
                    }
                    this.onRender();
                    console.log(`Done updating contexts.`);
                    console_log(`Took ${Date.now() - t0} ms.`);
                }
                catch (err) {
                    console.error(err);
                }
                finally {
                    updating = false;
                    rafr();
                    console.log('Fin.');
                }
            }, 'update')();
        };
        update();
    }
}
__decorate([
    LogGroup('Engine.instantiate', n => lognode(n)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Element, Context, Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "instantiate", null);
__decorate([
    LogGroup(`Engine.create`, n => `<${n}>`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Context, Object]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "create", null);
__decorate([
    LogGroup(`Engine.clone_2`, n => lognode(n)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Node, Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "clone", null);
__decorate([
    LogGroup(`Engine.compute`, (n, s) => lognode(s)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Element, Element, Context]),
    __metadata("design:returntype", void 0)
], Engine.prototype, "compute", null);
__decorate([
    LogGroup('Engine.transform', n => lognode(n)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Node, Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "transform", null);
__decorate([
    LogGroup('Engine.updateCtx'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "updateCtx", null);
__decorate([
    LogGroup('Engine.update', c => c.name, { rich: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "update", null);
__decorate([
    LogGroup('Engine.render', n => lognode(n), { rich: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Element, Context]),
    __metadata("design:returntype", Promise)
], Engine.prototype, "render", null);
