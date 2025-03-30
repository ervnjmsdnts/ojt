import { sql } from 'drizzle-orm';
import { mysqlTable as table } from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';

export const users = table('users', {
  id: t.int('id').primaryKey().autoincrement(),
  srCode: t.varchar('sr_code', { length: 50 }).notNull().unique(),
  password: t.varchar('password', { length: 255 }).notNull(),
  fullName: t.varchar('full_name', { length: 100 }).notNull(),
  role: t.mysqlEnum('role', ['admin', 'coordinator', 'student']).notNull(),
  gender: t.mysqlEnum('gender', ['male', 'female']).notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const insertUserSchema = createInsertSchema(users);
export const updateUserSchema = createUpdateSchema(users);

export const sessions = table('sessions', {
  id: t.int('id').primaryKey().autoincrement(),
  sessionId: t.varchar('session_id', { length: 255 }).notNull().unique(),
  userId: t.int('user_id').notNull(),
  createdAt: t
    .bigint('createdAt', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const companies = table('companies', {
  id: t.int('id').primaryKey().autoincrement(),
  name: t.varchar('name', { length: 255 }).notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const ojtApplication = table('ojt_application', {
  id: t.int('id').primaryKey().autoincrement(),
  studentId: t
    .int('student_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  coordinatorId: t.int('coordinator_id').references(() => users.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  companyId: t.int('company_id').references(() => companies.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  status: t
    .mysqlEnum('status', ['pre-ojt', 'ojt', 'post-ojt', 'completed'])
    .default('pre-ojt')
    .notNull(),
});

export const formTemplates = table('form_templates', {
  id: t.int('id').primaryKey().autoincrement(),
  title: t.varchar('form_name', { length: 255 }).notNull(),
  category: t.mysqlEnum('category', ['pre-ojt', 'ojt', 'post-ojt']).notNull(),
  fileUrl: t.text('file_url').notNull(),
  uploadedBy: t
    .int('uploaded_by')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: t
    .bigint('uploaded_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const insertFormTemplateSchema = createInsertSchema(formTemplates);

export const studentSubmissions = table('student_submissions', {
  id: t.int('id').primaryKey().autoincrement(),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  templateId: t
    .int('template_id')
    .notNull()
    .references(() => formTemplates.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  submittedFileUrl: t.text('submitted_file_url').notNull(),
  submissionDate: t
    .bigint('submission_date', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const notifications = table('notifications', {
  id: t.int('id').primaryKey().autoincrement(),
  message: t.text('message').notNull(),
  isGlobal: t.boolean('is_global').notNull().default(true),
  targetStudentId: t.int('target_student_id'),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const notificationRecipients = table('notification_recipients', {
  id: t.int('id').primaryKey().autoincrement(),
  notificationId: t
    .int('notification_id')
    .notNull()
    .references(() => notifications.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  studentId: t
    .int('student_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  read: t.boolean('read').default(false),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});
