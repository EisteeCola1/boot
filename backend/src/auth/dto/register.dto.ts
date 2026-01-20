export type RegisterDto = {
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  licenceIds?: number[];
};
