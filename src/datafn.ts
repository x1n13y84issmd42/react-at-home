import { Context } from "./context";
import { computer } from "./data";

export function id<T=string>(v: T): T {
	return v;
}

export function compute(ctx: Context): any{
	return (v: string) => computer(v, ctx);
}
