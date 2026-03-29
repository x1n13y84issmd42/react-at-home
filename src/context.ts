import { ResolvedComponent, EngineElement } from "./contracts";
import { LogGroup } from "./log";
import { State } from "./state";
import { genid, IDGen, lognode, makeid } from "./utility";

interface IContextDOM {
	// The virtual instance - i.e. the component 'reference' instance
	// as created initially, i.e. <MyOmponent></MyOmponent>
	vinst?: Element;

	// The actual DOM instance, in fact a copy of the component source.
	//TODO: get rid of this, refactor everything to use only multiple nodes.
	inst?: Element;
	
	// The component source template DOM markup.
	src?: Element;
	
	// Dummy DOM instance for components that have no single common root wrapper.
	dummy?: Element;

	// Other created nodes we might care about.
	nodes: Node[];

	id: {
		[id: string]: Element;
	};
}

function logCtx (this: Context) {
	return this.name;
}

export class Context<Tstate extends object = any, Tscope extends object = any> {
	readonly state: State.WithHooks<Tstate> = State.create<Tstate>({} as any, this);
	readonly scope: Tscope = {} as Tscope;

	dom: IContextDOM = {nodes: [], id: {}};
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
		const xvinst = vinst as EngineElement;
		xvinst._engine_ = xvinst._engine_ || {};

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
		const ctx = (e as EngineElement)._engine_?.ctx
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
