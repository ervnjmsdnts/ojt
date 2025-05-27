import { sql } from 'drizzle-orm';
import { mysqlTable as table } from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';

export const users = table('users', {
  id: t.int('id').primaryKey().autoincrement(),
  srCode: t.varchar('sr_code', { length: 50 }).notNull().unique(),
  email: t.varchar('email', { length: 255 }).notNull().unique(),
  password: t.varchar('password', { length: 255 }).notNull(),
  fullName: t.varchar('full_name', { length: 100 }).notNull(),
  role: t
    .mysqlEnum('role', ['admin', 'coordinator', 'student'])
    .notNull()
    .default('student'),
  gender: t.mysqlEnum('gender', ['male', 'female']).notNull(),
  profilePictureUrl: t.text('profile_picture_url'),
  isActive: t.boolean('is_active').default(true),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const passwordResetTokens = table('password_reset_tokens', {
  id: t.int('id').primaryKey().autoincrement(),
  userId: t
    .int('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  token: t.varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: t.bigint('expires_at', { mode: 'number' }).notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
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
  address: t.text('address'),
  memorandumUrl: t.text('memorandum_url'),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const insertCompanySchema = createInsertSchema(companies);
export const updateCompanySchema = createUpdateSchema(companies);

export const programs = table('programs', {
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

export const insertProgramSchema = createInsertSchema(programs);
export const updateProgramSchema = createUpdateSchema(programs);

export const departments = table('departments', {
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

export const insertDepartmentSchema = createInsertSchema(departments);
export const updateDepartmentSchema = createUpdateSchema(departments);

export const classes = table('classes', {
  id: t.int('id').primaryKey().autoincrement(),
  name: t.varchar('name', { length: 255 }).notNull(),
  programId: t
    .int('program_id')
    .notNull()
    .references(() => programs.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  departmentId: t
    .int('departmentId')
    .notNull()
    .references(() => departments.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const insertClassSchema = createInsertSchema(classes);
export const updateClassSchema = createUpdateSchema(classes);

export const studentCoordinatorRequest = table('student_coordinator_request', {
  id: t.int('id').primaryKey().autoincrement(),
  coordinatorId: t
    .int('coordinator_id')
    .notNull()
    .references(() => users.id, {
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
  status: t
    .mysqlEnum('status', ['pending', 'approved', 'rejected'])
    .notNull()
    .default('pending'),
  createdAt: t
    .bigint('uploaded_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const reports = table('reports', {
  id: t.int('id').primaryKey().autoincrement(),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  date: t.bigint('date', { mode: 'number' }),
  accomplishments: t.text('accomplishments').notNull(),
  numberOfWorkingHours: t.int('number_of_working_hours').notNull(),
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
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  classId: t.int('classId').references(() => classes.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  companyId: t.int('company_id').references(() => companies.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  totalOJTHours: t.int('total_ojt_hours'),
  yearLevel: t.varchar('year_level', { length: 255 }),
  semester: t.varchar('semester', { length: 255 }),
  supervisorEmail: t.varchar('supervisor_email', { length: 255 }),
  supervisorName: t.varchar('supervisor_name', { length: 255 }),
  supervisorContactNumber: t.varchar('supervisor_contact_number', {
    length: 255,
  }),
  supervisorAddress: t.text('supervisor_address'),
  studentCoordinatorRequestId: t
    .int('request_id')
    .references(() => studentCoordinatorRequest.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
  registrationFormUrl: t.text('registration_form_url'),
  status: t
    .mysqlEnum('status', ['pre-ojt', 'ojt', 'post-ojt', 'completed'])
    .default('pre-ojt')
    .notNull(),
  academicYear: t.varchar('academic_year', { length: 255 }),
});

export const logs = table('logs', {
  id: t.int('id').primaryKey().autoincrement(),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  text: t.text().notNull(),
  createdAt: t
    .bigint('uploaded_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const links = table('links', {
  id: t.int('id').primaryKey().autoincrement(),
  coordinatorId: t
    .int('coordinator_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  name: t.varchar('name', { length: 255 }).notNull(),
  url: t.text('url').notNull(),
});

// Requirements
export const formTemplates = table('form_templates', {
  id: t.int('id').primaryKey().autoincrement(),
  title: t.varchar('title', { length: 255 }).notNull(),
  category: t.mysqlEnum('category', ['pre-ojt', 'ojt', 'post-ojt']).notNull(),
  isEmailToSupervisor: t.boolean('is_email_to_supervisor').default(false),
  canStudentView: t.boolean('can_student_view').default(true),
  fileUrl: t.text('file_url'),
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

export const studentFeedbackTemplate = table('st_fb_temp', {
  id: t.int('id').primaryKey().autoincrement(),
  isActive: t.boolean('is_active').default(true),
  version: t.int('version').notNull().default(1),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const feedbackQuestions = table('fb_questions', {
  id: t.int('id').primaryKey().autoincrement(),
  templateId: t
    .int('template_id')
    .notNull()
    .references(() => studentFeedbackTemplate.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  question: t.text('question').notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const studentFeedbackResponse = table('st_fb_resp', {
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
    .references(() => studentFeedbackTemplate.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  templateVersion: t.int('template_version').notNull(),
  responseDate: t
    .bigint('response_date', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  problems: t.text('problems'),
  otherConcerns: t.text('other_concerns'),
  signature: t.text('signature'),
});

export const feedbackResponses = table('fb_responses', {
  id: t.int('id').primaryKey().autoincrement(),
  responseId: t
    .int('response_id')
    .notNull()
    .references(() => studentFeedbackResponse.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  questionId: t
    .int('question_id')
    .notNull()
    .references(() => feedbackQuestions.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  responseValue: t
    .mysqlEnum('response_value', ['SA', 'A', 'N', 'D', 'SD'])
    .notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const supervisorFeedbackTemplate = table('sv_fb_temp', {
  id: t.int('id').primaryKey().autoincrement(),
  isActive: t.boolean('is_active').default(true),
  version: t.int('version').notNull().default(1),
  studentSubmissionTemplateId: t
    .int('student_submission_template_id')
    .notNull()
    .references(() => formTemplates.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const supervisorFeedbackQuestions = table('sv_fb_questions', {
  id: t.int('id').primaryKey().autoincrement(),
  templateId: t
    .int('template_id')
    .notNull()
    .references(() => supervisorFeedbackTemplate.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  question: t.text('question').notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const supervisorFeedbackResponse = table('sv_fb_resp', {
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
    .references(() => supervisorFeedbackTemplate.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  templateVersion: t.int('template_version').notNull(),
  responseDate: t
    .bigint('response_date', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  otherCommentsAndSuggestions: t.text('other_comments_and_suggestions'),
  signature: t.text('signature'),
});

export const supervisorFeedbackResponses = table('sv_fb_responses', {
  id: t.int('id').primaryKey().autoincrement(),
  responseId: t
    .int('response_id')
    .notNull()
    .references(() => supervisorFeedbackResponse.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  questionId: t
    .int('question_id')
    .notNull()
    .references(() => supervisorFeedbackQuestions.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  responseValue: t
    .mysqlEnum('response_value', ['SA', 'A', 'N', 'D', 'SD'])
    .notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const supervisorFeedbackEmail = table('sv_fb_email', {
  id: t.int('id').primaryKey().autoincrement(),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  accessCode: t.varchar('access_code', { length: 255 }).notNull(),
  feedbackSubmitted: t.boolean('feedback_submitted').default(false),
  email: t.varchar('email', { length: 255 }).notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalTemplates = table('ap_templates', {
  id: t.int('id').primaryKey().autoincrement(),
  formTemplateId: t
    .int('form_template_id')
    .notNull()
    .references(() => formTemplates.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  isActive: t.boolean('is_active').default(true),
  version: t.int('version').notNull().default(1),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalCategories = table('ap_categories', {
  id: t.int('id').primaryKey().autoincrement(),
  templateId: t
    .int('template_id')
    .notNull()
    .references(() => appraisalTemplates.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  name: t.varchar('name', { length: 255 }).notNull(),
  displayOrder: t.int('display_order').notNull().default(0),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalQuestions = table('ap_questions', {
  id: t.int('id').primaryKey().autoincrement(),
  categoryId: t
    .int('category_id')
    .notNull()
    .references(() => appraisalCategories.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  question: t.text('question').notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  updatedAt: t
    .bigint('updated_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`)
    .$onUpdate(() => sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalResponse = table('ap_response', {
  id: t.int('id').primaryKey().autoincrement(),
  templateId: t
    .int('template_id')
    .notNull()
    .references(() => appraisalTemplates.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  comments: t.text('comments'),
  supervisorSignature: t.text('supervisor_signature'),
  totalPoints: t.int('total_points').notNull().default(0),
  supervisorSignatureDate: t
    .bigint('supervisor_signature_date', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalResponses = table('ap_responses', {
  id: t.int('id').primaryKey().autoincrement(),
  responseId: t
    .int('response_id')
    .notNull()
    .references(() => appraisalResponse.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  questionId: t
    .int('question_id')
    .notNull()
    .references(() => appraisalQuestions.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  rating: t.int('rating').notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

export const appraisalEmail = table('ap_email', {
  id: t.int('id').primaryKey().autoincrement(),
  ojtId: t
    .int('ojt_id')
    .notNull()
    .references(() => ojtApplication.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  accessCode: t.varchar('access_code', { length: 255 }).notNull(),
  feedbackSubmitted: t.boolean('feedback_submitted').default(false),
  email: t.varchar('email', { length: 255 }).notNull(),
  createdAt: t
    .bigint('created_at', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
});

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
  submittedFileUrl: t.text('submitted_file_url'),
  remarks: t.text('remarks'),
  status: t
    .mysqlEnum('status', ['pending', 'approved', 'resubmit'])
    .default('pending'),
  submissionDate: t
    .bigint('submission_date', { mode: 'number' })
    .default(sql`(UNIX_TIMESTAMP() * 1000)`),
  supervisorFeedbackResponseId: t
    .int('sv_fb_resp_id')
    .references(() => supervisorFeedbackResponse.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
  appraisalResponseId: t
    .int('appraisal_response_id')
    .references(() => appraisalResponse.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
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
