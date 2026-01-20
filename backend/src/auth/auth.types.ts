export type AuthTokenPayload = {
  sub: number;
  sessionId: string;
};

export type AuthenticatedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};
