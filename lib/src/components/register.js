import * as _for from './for';
import * as _if from './if';
import * as _error from './error';
export function register(engine) {
    engine.register('for', _for.stateFn, _for.domFn);
    engine.register('if', _if.stateFn, _if.domFn);
    engine.register('error', undefined, _error.domFn);
}
