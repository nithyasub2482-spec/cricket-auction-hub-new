declare namespace Express {
  interface Request {
    authUser?: {
      userId: number;
      role: string;
    };
  }
}
