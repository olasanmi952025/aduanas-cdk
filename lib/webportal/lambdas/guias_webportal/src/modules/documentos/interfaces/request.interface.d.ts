export interface RequestInterface extends Request {
    user: {
        id: number;
        sub: string;
    };
}
