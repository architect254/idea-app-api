import { User } from "src/api/users/user.entity";

export interface JwtPayload {
  user: User;
}
