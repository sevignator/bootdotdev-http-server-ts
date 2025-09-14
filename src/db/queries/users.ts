import { eq } from 'drizzle-orm';

import { db } from '../index.js';
import { type NewUser, type User, users } from '../schema.js';

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();

  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}

export async function getUserById(id: User['id']) {
  const [result] = await db.select().from(users).where(eq(users.id, id));

  return result;
}

export async function getUserByEmail(email: User['email']) {
  const [result] = await db.select().from(users).where(eq(users.email, email));

  return result;
}
