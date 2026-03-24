import { ResolvedComponent, RAHElement } from "./contracts";
import { LogGroup } from "./log";
import { State } from "./state";
import { genid, IDGen, lognode, makeid } from "./utility";

/* export class ContextStore<T extends Object = {}> {
	protected data: T = {} as T;
	
	[p: string]: any;

	reset(d: T) {
		this.data = {...d};
	}

	merge(...d: (T|ContextStore<T>)[]) {
		const d1 = {...this.data};
		const d2 = {...d.reduce((p: T, c: T|ContextStore<T>) => {return {...p, ...c}}, {} as T)};
		this.data = {...d1, ...d2};
	}

	set<K extends keyof T>(k: K, v: T[K]) {
		this.data[k] = v;
	}

	get<K extends keyof T>(k: K): T[K] {
		return this.data[k];
	}

	get value(): T {
		return this.data;
	}

	static create<T extends Object = {}>(): TContextStore<T> {
		//TODO: this proxy usage needs to be revised both design- & performance-wise.
		function get(o: ContextStore<T>, p: string) {
			// console.log(`ContextStore Proxy get`, p);

			if (p in o) return o[p];

			const pv = (o.value as any)[p];

			if (pv instanceof StateClosure) {
				return pv.value;
			}

			return pv;
		}
		
		function set(o: ContextStore<T>, p: string, v: any) {
			// console.log(`ContextStore Proxy set`, p);
			if (p in o)
				o[p] = v;
			else {
				const ovalue = o.value as any;
				if (ovalue[p] instanceof StateClosure) {
					ovalue[p].value = v;
				} else {
					ovalue[p] = v;
				}
			}

			return true;
		}

		return new Proxy(new ContextStore<T>(), {get, set}) as TContextStore<T>;
	}
} */

// export type TContextStore<T> = UnclosureState<T> & ContextStore<T>;

interface IContextDOM {
	// The virtual instance - i.e. the component 'reference' instance
	// as created initially, i.e. <MyOmponent></MyOmponent>
	vinst?: Element;

	// The actual DOM instance, in fact a copy of the component source.
	inst?: Element;
	
	// The component source template DOM markup.
	src?: Element;
	
	// Dummy DOM instance for components that have no single common root wrapper.
	dummy?: Element;

	// Other created nodes we might care about.
	nodes: Node[];
}

function logCtx (this: Context) {
	return this.name;
}

export class Context<Tstate extends object = any, Tscope extends object = any> {
	readonly state: State.WithHooks<Tstate> = State.create<Tstate>({} as any, this);
	readonly scope: Tscope = {} as Tscope;

	dom: IContextDOM = {nodes: []};
	rc?: ResolvedComponent;

	parent?: Context;

	protected _id!: string;
	// Version
	protected v = 0;
	// Version rendered
	protected vr = -1;

	protected idgen = IDGen();

	protected children: Map<string, Context> = new Map;

	constructor(state?: Tstate, scope?: Tscope) {
		LogGroup.wrap(() => {
			this.merge(this.state, state);
			this.merge(this.scope, scope);
		}, "Context.constructor()", undefined, {collapsed: true})();
	}
	
	@LogGroup("Context.child()", logCtx, {collapsed: true})
	child(vinst: Element, stateEx?: Tstate, scopeEx?: Tscope): Context<Tstate, Tscope> {
		console.log(`Context#${this.name}`);
		
		const vinstTagName = vinst.tagName.toLowerCase();

		let thatID = this.idgen.peek[vinstTagName];
		let that = this.children.get(thatID);

		console.log(`Looking for child Context#${thatID}...`);
		
		if (! that) {
			thatID = this.idgen[vinstTagName];
			that = new Context<Tstate, Tscope>(stateEx, scopeEx);
			that.parent = this;
			that.own(vinst, undefined, thatID);
			this.children.set(thatID, that);
			console.log(`+ Created child Context#${that.id}.`);
		} else {
			that.mergeState(stateEx);
			// Inc ID after reset();
			//TODO: not cool doing it like this.
			this.idgen[vinstTagName];
			console.log(`* Restored child Context#${that.id}.`);
		}

		return that;
	}

	@LogGroup("Context.merge()", logCtx, {collapsed: true})
	private merge<T extends object>(store: T, ...extras: (T|undefined)[]) {
		for (let e of extras) {
			if (!e) continue;

			for (let ek in e) {
				LogGroup.wrap(() => {
					store[ek] = e[ek];
				}, `${ek}=${e[ek]}`, undefined, {collapsed: true})();
			}
		}
	}

	mergeState(extra: any) {
		this.merge(this.state, extra);
	}

	@LogGroup("Context.own()", logCtx)
	own(vinst: Element, inst?: Element, id?: string) {
		const xvinst = vinst as RAHElement;
		xvinst.rah = xvinst.rah || {};

		if (! this.dom.vinst) {
			this._id = id || genid();
			this.dom.vinst = xvinst;
			console.log(`Now owned by`, lognode(this.dom.vinst));
			console.log(`New name is Context#${this.name}`);
		}
		
		if (vinst === this.dom.vinst) {
			if (inst) {
				console.log(`Owner changes inst from`, lognode(this.dom.inst), 'to', lognode(inst));
				this.dom.inst = inst;
			}
		}
	}

	static owned(e: Element) {
		const ctx = (e as RAHElement).rah?.ctx
		if (ctx) console.log(`Restored owned ctx from vinst`, lognode(e));
		return ctx;
	}

	onRender() {
		this.vr = this.v;
		console.log(`Context#${this.name} render vr=${this.vr}`);
	}

	onUpdate() {
		this.v++;
		console.log(`Context#${this.name} update v=${this.v}`);
	}

	@LogGroup('Context.reset()', logCtx, {collapsed: true})
	reset() {
		this.idgen = IDGen();
		console.log(`Context#${this.name} reset v=${this.v}`);
	}
	
	get needsRender() {
		console.log(`Context#${this.name} needsRender? v=${this.v} vr=${this.vr}`);
		return this.v !== this.vr;
	}

	get id(): string {
		return makeid([this.parent?.id, this._id]);
	}

	get name(): string {
		// return makeid([this.dom.vinst?.nodeName, this.id]);
		return this.id;
	}

	cid(id: string) {
		return makeid([this.id, id]);
	}
}
