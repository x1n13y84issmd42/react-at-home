import { computer } from "./data";
export function id(v) {
    return v;
}
export function compute(ctx) {
    return (v) => computer(v, ctx);
}
