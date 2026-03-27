import { UserResponse } from "src/users/interfaces/user";

export const userIsCompleted = (user: UserResponse): boolean => {
  if (!user.person) return false;
  if (!user.person.document_number) return false;
  if (!user.person.document_type_id) return false;
  if (!user.person.first_name) return false;
  if (!user.person.last_name) return false;
  if (!user.person.email) return false;
  
  return true;
};