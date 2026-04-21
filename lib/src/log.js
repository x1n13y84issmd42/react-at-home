import { isAsync } from "./utility";
export const console_log = console.log;
export function LogGroup(groupName, extra, opts) {
    return (target, prop, pd) => {
        pd.value = LogGroup.wrap(pd.value, groupName, extra, opts);
        return pd;
    };
}
(function (LogGroup) {
    function wrap(fn, groupName, extra, options) {
        if (isAsync(fn)) {
            return async function (...args) {
                let opened;
                try {
                    opened = _open(this, args, '*');
                    return await fn.apply(this, args);
                }
                catch (err) {
                    _catch(err);
                }
                finally {
                    _close(opened);
                }
            };
        }
        else {
            return function (...args) {
                let opened;
                try {
                    opened = _open(this, args);
                    return fn.apply(this, args);
                }
                catch (err) {
                    _catch(err);
                }
                finally {
                    _close(opened);
                }
            };
        }
        function _open(_this, args, postfix = '') {
            let extraLogData = extra?.apply(_this, args) || [];
            if (!Array.isArray(extraLogData)) {
                extraLogData = [extraLogData];
            }
            if (options?.collapsed)
                console.groupCollapsed(groupName + ' ' + postfix, ...extraLogData);
            else
                console.group(groupName + ' ' + postfix, ...extraLogData);
            return {
                t0: Date.now(),
            };
        }
        function _close(opened) {
            if (options?.rich) {
                console.groupCollapsed('.');
                const t = Date.now() - opened.t0;
                console.log(`t=${t} ms`);
                console.groupEnd();
            }
            console.groupEnd();
        }
        function _catch(err) {
            console.error(groupName);
            console.error(err);
            throw err;
        }
    }
    LogGroup.wrap = wrap;
})(LogGroup || (LogGroup = {}));
