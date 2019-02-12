
export type ValueOf<T> = {
    [key in keyof T]: T[key];
}[keyof T];
