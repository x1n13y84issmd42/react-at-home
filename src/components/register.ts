import { RAH } from "../core";
import * as _for from './for';
import * as _if from './if';
import * as _error from './error';
import * as _btn from './btn';

export function register(rah: RAH) {
	rah.register('for', _for.stateFn, _for.domFn);
	rah.register('if', _if.stateFn, _if.domFn);
	rah.register('error', undefined, _error.domFn);
	rah.register('btn', _btn.stateFn, _btn.domFn);
}
