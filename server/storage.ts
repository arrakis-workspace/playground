import { type User, type UpsertUser } from "@shared/schema";
import { authStorage } from "./replit_integrations/auth";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export const storage: IStorage = authStorage;
