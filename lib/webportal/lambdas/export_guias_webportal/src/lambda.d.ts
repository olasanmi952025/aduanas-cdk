import 'reflect-metadata';
export declare const handler: (event: any, context: any) => Promise<void | import("@fastify/aws-lambda").LambdaResponse | {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Allow-Methods': string;
    };
    body: string;
}>;
