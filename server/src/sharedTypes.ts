import { companies, users } from './db/schema';

export type User = Omit<typeof users.$inferSelect, 'password'>;
export type Company = typeof companies.$inferSelect;
