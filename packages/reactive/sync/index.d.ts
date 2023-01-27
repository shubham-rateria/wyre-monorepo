/**
 * We can do two things,
 * event emit when a new element is added to the output buffer and that gets sent.
 * check output buffer every second, and if any elements are present then output them
 */
export declare function Sync(obj: any, socketEndpoint: string | undefined, socketConfig: {
    path: string;
} | undefined, onChange: any): any;
