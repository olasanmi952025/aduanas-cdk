export interface RequestInterface {
  user: {
    sub: string;
    username: string;
    roles: string[];
    email: string;
    tokenUse: string;
    clientId: string;
    aud: string;
    iss: string;
  };
}