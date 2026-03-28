import { LogGroup } from "./log";

export const handlers = {
	generic: handlerFactory<Event>,

	abort: handlerFactory<UIEvent>,
	afterprint: handlerFactory<Event>,
	animationend: handlerFactory<AnimationEvent>,
	animationiteration: handlerFactory<AnimationEvent>,
	animationstart: handlerFactory<AnimationEvent>,
	beforeprint: handlerFactory<Event>,
	beforeunload: handlerFactory<UIEvent>,
	blur: handlerFactory<FocusEvent>,
	canplay: handlerFactory<Event>,
	canplaythrough: handlerFactory<Event>,
	change: handlerFactory<Event>,
	click: handlerFactory<MouseEvent>,
	contextmenu: handlerFactory<MouseEvent>,
	copy: handlerFactory<ClipboardEvent>,
	cut: handlerFactory<ClipboardEvent>,
	dblclick: handlerFactory<MouseEvent>,
	drag: handlerFactory<DragEvent>,
	dragend: handlerFactory<DragEvent>,
	dragenter: handlerFactory<DragEvent>,
	dragleave: handlerFactory<DragEvent>,
	dragover: handlerFactory<DragEvent>,
	dragstart: handlerFactory<DragEvent>,
	drop: handlerFactory<DragEvent>,
	durationchange: handlerFactory<Event>,
	ended: handlerFactory<Event>,
	error: handlerFactory<Event>,
	focus: handlerFactory<FocusEvent>,
	focusin: handlerFactory<FocusEvent>,
	focusout: handlerFactory<FocusEvent>,
	fullscreenchange: handlerFactory<Event>,
	fullscreenerror: handlerFactory<Event>,
	hashchange: handlerFactory<HashChangeEvent>,
	input: handlerFactory<InputEvent>,
	invalid: handlerFactory<Event>,
	keydown: handlerFactory<KeyboardEvent>,
	keypress: handlerFactory<KeyboardEvent>,
	keyup: handlerFactory<KeyboardEvent>,
	load: handlerFactory<UIEvent>,
	loadeddata: handlerFactory<Event>,
	loadedmetadata: handlerFactory<Event>,
	loadstart: handlerFactory<ProgressEvent>,
	message: handlerFactory<Event>,
	mousedown: handlerFactory<MouseEvent>,
	mouseenter: handlerFactory<MouseEvent>,
	mouseleave: handlerFactory<MouseEvent>,
	mousemove: handlerFactory<MouseEvent>,
	mouseover: handlerFactory<MouseEvent>,
	mouseout: handlerFactory<MouseEvent>,
	mouseup: handlerFactory<MouseEvent>,
	mousewheel: handlerFactory<WheelEvent>,
	offline: handlerFactory<Event>,
	online: handlerFactory<Event>,
	open: handlerFactory<Event>,
	pagehide: handlerFactory<PageTransitionEvent>,
	pageshow: handlerFactory<PageTransitionEvent>,
	paste: handlerFactory<ClipboardEvent>,
	pause: handlerFactory<Event>,
	play: handlerFactory<Event>,
	playing: handlerFactory<Event>,
	popstate: handlerFactory<PopStateEvent>,
	progress: handlerFactory<Event>,
	ratechange: handlerFactory<Event>,
	resize: handlerFactory<UIEvent>,
	reset: handlerFactory<Event>,
	scroll: handlerFactory<UIEvent>,
	search: handlerFactory<Event>,
	seeked: handlerFactory<Event>,
	seeking: handlerFactory<Event>,
	select: handlerFactory<UIEvent>,
	show: handlerFactory<Event>,
	stalled: handlerFactory<Event>,
	storage: handlerFactory<StorageEvent>,
	submit: handlerFactory<Event>,
	suspend: handlerFactory<Event>,
	timeupdate: handlerFactory<Event>,
	toggle: handlerFactory<Event>,
	touchcancel: handlerFactory<TouchEvent>,
	touchend: handlerFactory<TouchEvent>,
	touchmove: handlerFactory<TouchEvent>,
	touchstart: handlerFactory<TouchEvent>,
	transitionend: handlerFactory<TransitionEvent>,
	unload: handlerFactory<UIEvent>,
	volumechange: handlerFactory<Event>,
	waiting: handlerFactory<Event>,
	wheel: handlerFactory<WheelEvent>,
};

export type HandlerFactories = typeof handlers;
export type Handlers = {[e in keyof HandlerFactories]?: ReturnType<HandlerFactories[e]>};

/**
 * Produces typed DOM event handlers.
 * @param fn A function to call in the handler.
 * @returns 
 */
function handlerFactory<TE extends Event>(fn: Function) {
	return LogGroup.wrap(function (e?: TE) {
		// if (e) {
		// 	e.preventDefault();
		// 	e.stopPropagation();
		// }

		// console.dir(e);
		return fn(e);
	}, ' > event', e => e.type);
}