import {
    timestamp,
    pgTable,
    text,
    primaryKey,
    integer,
    serial,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";
import { AdapterAccount } from "@auth/core/adapters";
import { relations  }  from "drizzle-orm";
import { subscribe } from "diagnostics_channel";
 
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  subscribed: boolean("subscribed"),
})

export const usersRelations = relations(users, ({ many }) => ({
    quizzes: many(quizzes),
}));
 
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)
 
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const quizzes = pgTable("quizzes", {
    id: serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    userId: text("user_id").references(() => users.id),
})


export const questions = pgTable("questions", {
    id: serial("id").primaryKey(),
    questionText: text("question_text"),
    quizzId: integer("quiz_id"),
});

export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
    question: many(questions),
    submissions: many(quizzSubmissions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    quizz: one(quizzes,{
        fields: [questions.quizzId],
        references: [quizzes.id],
    }),
    answers: many(questionAnswers),
}));

export const questionAnswers = pgTable("question_answers", {
    id: serial("id").primaryKey(),
    questionId: integer("question_id"),
    answerText: text("answer_text"),
    isCorrect: boolean("is_correct"),
});

export const questionAnswersRelations = relations(questionAnswers, ({ one }) => ({
    question: one(questions, {
        fields: [questionAnswers.questionId],
        references: [questions.id],
    }),
}));

export const quizzSubmissions = pgTable("quizz_submissions", {
    id: serial("id").primaryKey(),
    quizzId: integer("quizz_id"),
    // userId: text("user_id").references(() => users.id),
    score: integer("score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzSubmissionsRelations = relations(quizzSubmissions,
   ({ one, many }) => ({
    quizz: one(quizzes, {
        fields: [quizzSubmissions.quizzId],
        references: [quizzes.id],
    }),
}));


