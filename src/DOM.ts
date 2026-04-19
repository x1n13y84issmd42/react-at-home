import { AttrMapFn, I$, NodeFilter, NodeMultiplexer, Nodes } from "./contracts";
import { Handlers, handlers } from "./handlers";
import { LogGroup } from "./log";
import { imap, lognode } from "./utility";

export class DOM implements I$ {
    // @LogGroup('$.isHTMLTag')
	isHTMLTag(e: Node) {
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
			// SVG
			"a","animate","animateMotion","animateTransform",
			"circle","clipPath",
			"defs","desc",
			"ellipse",
			"feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject",
			"g",
			"image",
			"line","linearGradient",
			"marker","mask","metadata","mpath",
			"path","pattern","polygon","polyline",
			"radialGradient","rect",
			"script","set","stop","style","svg","switch","symbol",
			"text","textPath","title","tspan",
			"use",
			"view"
		].includes(e.nodeName.toLowerCase());
	}

	//TODO: get rid of this "single node" workflow.
    @LogGroup('$.replace', (o, n) => `-${lognode(o)} +${n.length}`)
	replace(oldE: Node, newEs: Nodes) {
		if (! oldE.parentNode) {
			console.error(`The element replaced has no parentNode.`);
			return;
		}

		for (let newE of newEs) {
			console.log(lognode(newE));
			oldE.parentNode.insertBefore(newE, oldE);
		}

		oldE.parentNode.removeChild(oldE);
	}

    @LogGroup('$.replace2', (o, n) => `-${o?.length} +${n?.length}`)
	replace2(oldEs: Nodes, newEs: Nodes) {
		
		if (!oldEs || !newEs) {
			return;
		}
		
		let inserted = false;
		
		for (let oldE of oldEs) {
			if (! oldE.parentNode) {
				console.error(`The element replaced (${oldE}) has no parentNode.`);
				continue;
			}

			if (! inserted) {
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

	@LogGroup('$.clone', e => lognode(e), {collapsed: true})
	clone(e: Node, attrMap?: AttrMapFn) {
		const cloneE = e.cloneNode() as Element;

		

    	return cloneE;
	}

	@LogGroup('$.append', (e, c, fn) => [lognode(e), '<', c.length, fn ? '+' : '-'])
	async append(e: Node, children: Nodes, fn?: NodeMultiplexer, filter?: NodeFilter) {
		if (! children?.length) return;

		if (fn) {
			console.log(`multi`);
			const multichildren = await imap(children, fn, filter);
			await Promise.all(await imap(multichildren, async (mc) => mc?.length ? this.append(e, mc) : void 0));
		} else {
			for (let c of children) {
				console.log(lognode(c));
				e.appendChild(c);
			}
		}
	}

	async map(nodes: Nodes, fn: NodeMultiplexer, filter?: NodeFilter): Promise<Nodes> {
		if (! nodes.length) return nodes;

		const multichildren = await Promise.all(await imap(nodes, fn, filter));
		
		const res: Node[] = [];
		for (let mc of multichildren) {
			res.push(...mc);
		}

		return res;
	}

	createPlaceholder(id: string) {
		const e = document.createElement('template');
		e.setAttribute('component', id);
		return e;
	}
}
