var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { LogGroup } from "./log";
import { State } from "./state";
import { genid, IDGen, lognode, makeid } from "./utility";
function logCtx() {
    return this.name;
}
export class Context {
    state = State.create({}, this);
    scope = {};
    dom = { nodes: [], id: {} };
    rc;
    parent;
    _id;
    v = 0;
    vr = -1;
    idgen = IDGen();
    children = new Map;
    constructor(state, scope) {
        LogGroup.wrap(() => {
            this.merge(this.state, state);
            this.merge(this.scope, scope);
        }, "Context.constructor()", undefined, { collapsed: true })();
    }
    child(vinst, stateEx, scopeEx) {
        console.log(`Context#${this.name}`);
        const vinstTagName = vinst.tagName.toLowerCase();
        let thatID = this.idgen.peek[vinstTagName];
        let that = this.children.get(thatID);
        console.log(`Looking for child Context#${thatID}...`);
        if (!that) {
            thatID = this.idgen[vinstTagName];
            that = new Context(stateEx, scopeEx);
            that.parent = this;
            that.own(vinst, undefined, thatID);
            this.children.set(thatID, that);
            console.log(`+ Created child Context#${that.id}.`);
        }
        else {
            that.mergeState(stateEx);
            this.idgen[vinstTagName];
            console.log(`* Restored child Context#${that.id}.`);
        }
        return that;
    }
    merge(store, ...extras) {
        for (let e of extras) {
            if (!e)
                continue;
            for (let ek in e) {
                LogGroup.wrap(() => {
                    store[ek] = e[ek];
                }, `${ek}=${e[ek]}`, undefined, { collapsed: true })();
            }
        }
    }
    mergeState(extra) {
        this.merge(this.state, extra);
    }
    own(vinst, inst, id) {
        const xvinst = vinst;
        xvinst._engine_ = xvinst._engine_ || {};
        if (!this.dom.vinst) {
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
    static owned(e) {
        const ctx = e._engine_?.ctx;
        if (ctx)
            console.log(`Restored owned ctx from vinst`, lognode(e));
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
    reset() {
        this.idgen = IDGen();
        console.log(`Context#${this.name} reset v=${this.v}`);
    }
    get needsRender() {
        console.log(`Context#${this.name} needsRender? v=${this.v} vr=${this.vr}`);
        return this.v !== this.vr;
    }
    get id() {
        return makeid([this.parent?.id, this._id]);
    }
    get name() {
        return this.id;
    }
    cid(id) {
        return makeid([this.id, id]);
    }
}
__decorate([
    LogGroup("Context.child()", logCtx, { collapsed: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Element, Object, Object]),
    __metadata("design:returntype", Context)
], Context.prototype, "child", null);
__decorate([
    LogGroup("Context.merge()", logCtx, { collapsed: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof T !== "undefined" && T) === "function" ? _a : Object, Object]),
    __metadata("design:returntype", void 0)
], Context.prototype, "merge", null);
__decorate([
    LogGroup("Context.own()", logCtx),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Element, Element, String]),
    __metadata("design:returntype", void 0)
], Context.prototype, "own", null);
__decorate([
    LogGroup('Context.reset()', logCtx, { collapsed: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Context.prototype, "reset", null);
