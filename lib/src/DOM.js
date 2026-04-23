var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { LogGroup } from "./log";
import { imap, lognode } from "./utility";
export class DOM {
    isHTMLTag(e) {
        return (e.nodeType === Node.TEXT_NODE) || (e.nodeType === Node.COMMENT_NODE) || [
            "a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio",
            "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button",
            "canvas", "caption", "center", "cite", "code", "col", "colgroup",
            "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt",
            "em", "embed",
            "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset",
            "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html",
            "i", "iframe", "img", "input", "ins",
            "kbd",
            "label", "legend", "li", "link",
            "main", "map", "mark", "meta", "meter",
            "nav", "noframes", "noscript",
            "object", "ol", "optgroup", "option", "output",
            "p", "param", "picture", "pre", "progress",
            "q",
            "rp", "rt", "ruby",
            "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg",
            "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt",
            "u", "ul",
            "var", "video", "wbr",
            "a", "animate", "animateMotion", "animateTransform",
            "circle", "clipPath",
            "defs", "desc",
            "ellipse",
            "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "foreignObject",
            "g",
            "image",
            "line", "linearGradient",
            "marker", "mask", "metadata", "mpath",
            "path", "pattern", "polygon", "polyline",
            "radialGradient", "rect",
            "script", "set", "stop", "style", "svg", "switch", "symbol",
            "text", "textPath", "title", "tspan",
            "use",
            "view"
        ].includes(e.nodeName.toLowerCase());
    }
    replace(oldE, newEs) {
        if (!oldE.parentNode) {
            console.error(`The element replaced has no parentNode.`);
            return;
        }
        for (let newE of newEs) {
            console.log(lognode(newE));
            oldE.parentNode.insertBefore(newE, oldE);
        }
        oldE.parentNode.removeChild(oldE);
    }
    replace2(oldEs, newEs) {
        if (!oldEs || !newEs) {
            return;
        }
        let inserted = false;
        for (let oldE of oldEs) {
            if (!oldE.parentNode) {
                console.error(`The element replaced (${oldE}) has no parentNode.`);
                continue;
            }
            if (!inserted) {
                for (let newE of newEs) {
                    console.log('+', lognode(newE));
                    oldE.parentNode.insertBefore(newE, oldE);
                }
                inserted = true;
            }
            console.log('-', lognode(oldE));
            oldE.parentNode.removeChild(oldE);
        }
    }
    clone(e, attrMap) {
        const cloneE = e.cloneNode();
        return cloneE;
    }
    async append(e, children, fn, filter) {
        if (!children?.length)
            return;
        if (fn) {
            console.log(`multi`);
            const multichildren = await imap(children, fn, filter);
            await Promise.all(await imap(multichildren, async (mc) => mc?.length ? this.append(e, mc) : void 0));
        }
        else {
            for (let c of children) {
                console.log(lognode(c));
                e.appendChild(c);
            }
        }
    }
    async map(nodes, fn, filter) {
        if (!nodes.length)
            return nodes;
        const multichildren = await Promise.all(await imap(nodes, fn, filter));
        const res = [];
        for (let mc of multichildren) {
            res.push(...mc);
        }
        return res;
    }
    createPlaceholder(id) {
        const e = document.createElement('template');
        e.setAttribute('component', id);
        return e;
    }
}
__decorate([
    LogGroup('$.replace', (o, n) => `-${lognode(o)} +${n.length}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Node, Object]),
    __metadata("design:returntype", void 0)
], DOM.prototype, "replace", null);
__decorate([
    LogGroup('$.replace2', (o, n) => `-${o?.length} +${n?.length}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DOM.prototype, "replace2", null);
__decorate([
    LogGroup('$.clone', e => lognode(e), { collapsed: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Node, Function]),
    __metadata("design:returntype", void 0)
], DOM.prototype, "clone", null);
__decorate([
    LogGroup('$.append', (e, c, fn) => [lognode(e), '<', c.length, fn ? '+' : '-']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Node, Object, Function, Function]),
    __metadata("design:returntype", Promise)
], DOM.prototype, "append", null);
