import { Context } from './context';
import { DOMFn, IRAH, Nodes, ResolvedComponent, StateFn } from './contracts';
import { computer } from './data';
import * as datafn from './datafn';
import { DOM } from './DOM';
import { console_log, LogGroup } from './log';
import { lognode } from './utility';

type RegisteredComponent = {
    stateFn?: StateFn;
    domFn?: DOMFn;
};

export class RAH implements IRAH {
    protected registry: Record<string, RegisteredComponent> = {};

	constructor(
        private $ = new DOM(),
	) {
		///
	}

    register(compName: string, stateFn?: StateFn, domFn?: DOMFn) {
        this.registry[compName.toLowerCase()] = {
            stateFn,
            domFn,
        };
    }

    resolve(compName: string): ResolvedComponent {
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
    async instantiate(vinst: Element, parentCtx: Context, instCtx?: Context): Promise<Nodes> {        
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

        instCtx.state.hooks.set.push((bcs: Set<Context>) => {
            for (let bc of bcs) {
                bc.onUpdate();
                this.queue.add(bc);
            }
            console.log(`Queue ${bcs.size} ctxs, now having ${this.queue.size}`);
        });

        parentCtx.state.hooks.get.with(this.bindContext(instCtx), () => {
            const attrFn = this.getAttrFn(parentCtx);
            for (let a of vinst.attributes) {
                instState[a.name] = attrFn(a.name, a.value);
                //TODO: handle special attributes such as x-if, x-as, x-root etc.
            }
        });

        instCtx.mergeState(instState);

        const nodes = await this.create(vinst.nodeName, instCtx);
        console.log(`Rendered.`, instCtx.dom.nodes);
        instCtx.onRender();
        return nodes;
    }

    bindContext(ctx: Context) {
        return (bc: Set<Context>) => {
            bc.add(ctx);
            console.log(`Added ctx#${ctx.id}. bc.size=${bc.size}`);
        };
    }

    @LogGroup(`Engine.create`, n => `<${n}>`)
    async create(compName: string, ctx: Context): Promise<Nodes> {
        const comp = await this.resolve(compName);
        if (comp) {
            ctx.dom.nodes = [];

            if (comp.stateFn) {
                const stateFn = LogGroup.wrap(comp.stateFn, 'stateFn()', undefined, {collapsed: true});
                ctx.mergeState(stateFn(ctx.state));
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

    @LogGroup(`Engine.clone`, n => lognode(n))
    async clone(vinst: Node, ctx: Context): Promise<Element> {
        ctx.own(vinst as Element);

        return await ctx.state.hooks.get.with(this.bindContext(ctx), async () => {
            const inst = this.$.clone(vinst, this.getAttrFn(ctx));
            ctx.own(vinst as Element, inst);

            //TODO: need a better way to manage/configure/handle different types of nodes.
            if (inst.nodeType === Node.TEXT_NODE) {
                inst.nodeValue = computer(inst.nodeValue, ctx);
            } else if (vinst.childNodes.length) {
                await this.$.append(
                    inst,
                    vinst.childNodes,
                    cn => this.transform(cn, ctx),
                    this.filter
                );
            }
    
            return inst;

        });
    }

    // @LogGroup('Engine.filter')
    filter(vinst: Node): boolean {
        // Not allowing empty space nodes (those are usually code formatting).
        if (vinst.nodeType === Node.TEXT_NODE && vinst.nodeValue.trim().length === 0) {
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
            return await this.create('error', new Context({error: err}));
        }
    }

    @LogGroup('Engine.updateCtx')
    async updateCtx(ctx: Context): Promise<Nodes> {
        console.dir(ctx);

        try {
            ctx.reset();

            if (this.$.isHTMLTag(ctx.dom.vinst)) {
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
        if (!ctx.needsRender) {
            console.log(`Already rendered.`);
            return;
        }

        if (ctx.dom.inst) {
            console.dir('"inst" case');
            // updateCtx() will modify ctx.dom
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

    @LogGroup('Engine.render', n => lognode(n), {rich: true})
    async render(vinst: Element, ctx?:Context<Record<string, any>>) {
        let updating = false;

        ctx = ctx ? ctx.child(vinst, ctx.state, ctx.scope) : new Context();
        
        ctx.state.hooks.set.push((bcs: Set<Context>) => {
            for (let bc of bcs) {
                bc.onUpdate();
                this.queue.add(bc);
            }
            console.log(`Queue ${bcs.size} ctxs, now having ${this.queue.size}`);
        });

        document.getElementById('update').onclick = () => {
            // ctx.state.n *= 5;
            // ctx.state.ns.push(Math.round(Math.random() * 100));
            // ctx.state.ns = ctx.state.ns;
            // ctx.state.ns = ctx.state.ns;
            update();
        };

        //TODO: move to update manager
        const update_old = async () => {
            const rafr = () => requestAnimationFrame(update);
            if (this.queue.size < 1) return rafr();

            if (updating) return rafr();
            updating = true;
            
            const t0 = Date.now();
            try {
                const q = [...this.queue];
                this.queue.clear();
                console.log(`** updating ${q.length} contexts...`);
                for (let c of q) {
                    await this.update(c);
                }
                console.log(`** done updating contexts...`);
                console_log(`** took ${Date.now()-t0} ms.`);
            } catch(err) {
                console.error('** update error', err);
            } finally {
                updating = false;
                rafr();
                console.log('** update fin');
            }
            
        };

        const update = async () => {
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

        this.$.replace(vinst, await this.transform(vinst, ctx));

        update();
    }
}
