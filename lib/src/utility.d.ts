export declare function lognode(n?: Node): string;
export declare function imap<T, R>(i: Iterable<T>, fn: (v: T) => Promise<R>, filter?: (v: T) => boolean): Promise<R[]>;
export type Keys<T extends object> = Extract<keyof T, 'string'>;
export declare function isAsync(fn: Function): boolean;
export declare function genid(): string;
export declare function makeid(pieces: (string | undefined)[]): string;
export type IDGeneratorKeys<T = any> = {
    readonly [p in keyof T]: string;
};
export type IDGenerator<T = any> = IDGeneratorKeys<T> & {
    peek: any;
    reset: () => void;
};
export declare function IDGen<T = any>(): IDGenerator<T>;
