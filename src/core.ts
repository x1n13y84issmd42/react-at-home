import { Context } from './context';
import { DOMFn, EngineElement, IEngine, Nodes, OnRenderFn, ResolvedComponent, StateFn } from './contracts';
import { computer } from './data';
import * as datafn from './datafn';
import { DOM } from './DOM';
import { console_log, LogGroup } from './log';
import { lognode } from './utility';
import { Handlers, handlers } from "./handlers";
import { State } from './state';


type RegisteredComponent = {
    stateFn?: StateFn;
    domFn?: DOMFn;
    onRenderFn?: OnRenderFn;
};

export class Engine implements IEngine {
    protected registry: Record<string, RegisteredComponent> = {};

    // Here components' onRender() are stored during rendering
    // and executed once all the elements are in the DOM. 
    //TODO: needs refactor/redesign.
    protected onRenderStash: Function[] = [];

	constructor(
        private $ = new DOM(),
	) {
		///
	}

    onRender() {
        console.log(`Having ${this.onRenderStash.length} onRender callbacks.`);
        for (let fn of this.onRenderStash) {
            fn();
        }
    }

    register(compName: string, stateFn?: StateFn, domFn?: DOMFn, onRenderFn?: OnRenderFn) {
        this.registry[compName.toLowerCase()] = {
            stateFn,
            domFn,
            onRenderFn,
        };
    }

    resolve(compName: string): ResolvedComponent | undefined {
        compName = compName.toLowerCase();

        const rc: ResolvedComponent = {
            src: document.querySelectorAll(`component\\:${compName}`).item(0),
            ... (this.registry[compName] || {}),
        };

        if (rc.src || rc.domFn) {
            return rc;
        }

        return undefined;
    }

    @LogGroup('Engine.instantiate', n => lognode(n))
    async instantiate(vinst: Element, parentCtx?: Context, instCtx?: Context): Promise<Nodes> {        
        if (! parentCtx) {
            throw new Error(`Missing parent Context.`);
        }

        if (! instCtx) {
            instCtx = parentCtx.child(vinst);
            instCtx.reset();
        }

        if (! instCtx.needsRender) {
            console.log(`Just instantiated & up to date.`);
            return instCtx.dom.nodes;
        }

        instCtx.dom.nodes = [];
        const instState = {} as any;

        instCtx.state.hooks.set.push(this.onStateUpdate.bind(this));

        const comp = this.resolve(vinst.nodeName);

        instCtx.update = async () => {
            const attrFn = this.getAttrFn(parentCtx);
            for (let a of vinst.attributes) {
                instState[a.name] = attrFn(a.name, a.value);
                //TODO: handle special attributes such as x-if, x-as, x-root etc.
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

    @LogGroup(`Engine.create`, n => `<${n}>`)
    async create(compName: string, ctx: Context, comp?: ResolvedComponent): Promise<Nodes> {
        comp = comp || await this.resolve(compName);
        let created = true;
        if (comp) {
            ctx.dom.nodes = [];

            if (comp.stateFn) {
                const stateFn = LogGroup.wrap(comp.stateFn, 'stateFn()', undefined, {collapsed: true});
                await stateFn(ctx.state);

                const prevUpdate = ctx.update || (async () => {});
                ctx.update = async () => {
                    prevUpdate();
                    await stateFn(ctx.state);
                };
            }

            if (comp.src) {
                ctx.dom.src = comp.src;
                const nodes = await this.$.map(
                    comp.src.childNodes,
                    cn => this.transform(cn, ctx),
                    this.filter
                );
                ctx.dom.nodes.push(...nodes);
            }

            if (comp.domFn) {
                const domFn = LogGroup.wrap(comp.domFn, 'domFn()');
                ctx.dom.nodes.push(...(await domFn(ctx, this.$, this)||[]));
                console.log(`After domFn(): ${ctx.dom.nodes.length} child nodes`);

                if (! ctx.dom.nodes.length) {
                    // This serves as a placeholder for unrendered nodes (like <if cond=false>)
                    // to allow replacement later when the node is rendered.
                    ctx.dom.nodes = [this.$.createPlaceholder(ctx.id)];
                    created = false;
                }
            }

            if (created && comp.onRenderFn) {
                //TODO: refactor this entire idea with onRender.
                this.onRenderStash.push(() => comp.onRenderFn && comp.onRenderFn(ctx));
            }

            return ctx.dom.nodes;
        }

        throw new Error(`Component <${compName}> is unknown.`);
    }

    getAttrFn(ctx: Context) {
        return LogGroup.wrap((an: string, av: string) => {
                //TODO: someone might want these configurable at some point.
                const fn = ({
                    // 'id': (_: string) => ctx.id,
                    'id': datafn.id,
                } as any)[an] || datafn.compute(ctx);

                const res = fn(av);
                console.log(an, '=', res);
                return res;
            },
            'attrFn',
            (n, v) => `(${n}, ${v})`,
            {collapsed: true}
        );
    }

    @LogGroup(`Engine.clone_2`, n => lognode(n))
    async clone(vinst: Node, ctx: Context): Promise<EngineElement> {

        const inst = this.$.clone(vinst, this.getAttrFn(ctx)) as EngineElement;
        inst._engine_ = {
            ctx,
            update: () => this.compute(inst, vinst as Element, ctx),
        };

        return await ctx.state.hooks.get.forElement(inst, async () => {
            inst._engine_.update();

            if (inst.nodeType !== Node.TEXT_NODE) {
                const instID = inst.getAttribute('id');
                if (instID) {
                    ctx.dom.id[instID] = inst;
                }
    
                if (vinst.childNodes.length) {
                    await this.$.append(
                        inst,
                        vinst.childNodes,
                        cn => this.transform(cn, ctx),
                        this.filter
                    );
                }
            }
    
            return inst;
        });

    }

    @LogGroup(`Engine.compute`, (n, s) => lognode(s))
    compute(inst: Element, src: Element, ctx: Context) {
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
                            inst.addEventListener(match[1], handlers[match[1] as keyof Handlers](av));
                        } else {
                            console.warn(`Unknown event handler ${a.name}.`);
                            inst.addEventListener(match[1], handlers.generic(av));
                        }
                        console.log(`+ "${match[1]}" event handler`);
                        continue;
                    } else {
                        console.warn(`Unexpected function value attribute ${a.name}. Skipping it.`);
                        continue;
                    }
                }
                
                inst.setAttribute(a.name, av);
            }
        }
    }

    // @LogGroup('Engine.filter')
    filter(vinst: Node): boolean {
        // Not allowing empty space nodes (those are usually code formatting).
        if (vinst.nodeType === Node.TEXT_NODE && (vinst.nodeValue || '').trim().length === 0) {
            return false;
        }

        if (vinst.nodeType === Node.COMMENT_NODE) {
            return false;
        }

        return true;
    }

    @LogGroup('Engine.transform', n => lognode(n))
    async transform(vinst: Node, ctx: Context): Promise<Nodes> {
        try {
            if (! this.filter(vinst)) {
                return [];
            }
    
            if (this.$.isHTMLTag(vinst)) {
                return [await this.clone(vinst, ctx)];
            }
    
            return await this.instantiate(vinst as Element, ctx);
        } catch(err) {
            return await this.create('error', new Context({error: err, nodeName: vinst.nodeName, ctxID: ctx.id}));
        }
    }

    @LogGroup('Engine.updateCtx')
    async updateCtx(ctx: Context): Promise<Nodes> {
        console.dir(ctx);

        try {
            ctx.reset();

            if (ctx.dom.vinst && this.$.isHTMLTag(ctx.dom.vinst)) {
                ctx.dom.inst = await this.clone(ctx.dom.vinst, ctx);
                return [ctx.dom.inst];
            }
    
            return await this.instantiate(ctx.dom.vinst as Element, ctx.parent, ctx);
        } catch(err) {
            console.error('** updateCtx ERROR', err, ctx);
            // return await this.create('error', new Context({error: err}));
            return [];
        }
    }

    @LogGroup('Engine.update', c => c.name, {rich: true})
    async update(ctx: Context) {
        // This update happens for components that've been removed from DOM
        // but if their context is in queue.
        //TODO: fix this.

        if (!ctx.needsRender) {
            console.log(`Already rendered.`);
            return;
        }

        if (ctx.dom.inst) {
            console.dir('"inst" case');
            // updateCtx() will modify ctx.dom
            //TODO: find a way to avoid recreating already rendered elements.
            const inst = ctx.dom.inst;
            this.$.replace(inst, await this.updateCtx(ctx));
        } else {
            console.dir('"nodes" case');
            const nodes = ctx.dom.nodes;
            this.$.replace2(nodes, await this.updateCtx(ctx));
        }

        ctx.onRender();
    }

    protected queue = new Set<Context>;

    onStateUpdate(bound: State.BoundElements) {
        for (const ctx of bound.contexts) {
            console.log(`Updating context`, ctx.id);
            ctx.onUpdate();
            // this.queue.add(ctx);
            ctx.update && ctx.update();
        }

        for (const e of bound.elements) {
            console.log(`Updating element`, lognode(e));
            e._engine_.update();
        }

        console.log(`Queue ${bound.contexts.size} ctxs, now having ${this.queue.size}`);
    }

    @LogGroup('Engine.render', n => lognode(n), {rich: true})
    async render(vinst: Element, ctx?:Context<Record<string, any>>) {
        this.onRenderStash = [];

        if (! vinst) {
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

            if (this.queue.size < 1) return rafr();

            if (updating) return rafr();

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
                    console_log(`Took ${Date.now()-t0} ms.`);
                } catch(err) {
                    console.error(err);
                } finally {
                    updating = false;
                    rafr();
                    console.log('Fin.');
                }
            }, 'update')();
        };

        update();
    }
}
