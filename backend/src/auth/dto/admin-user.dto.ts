export type AdminUserLicenceDto = {
  licence: {
    id: number;
    title: string;
  };
};

export type AdminUserDto = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  licences: AdminUserLicenceDto[];
};
