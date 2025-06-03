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
import { relations } from "drizzle-orm";

// Table Users
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
});

// Relation for table Users
export const usersRelations = relations(users, ({ many }) => ({
    quizzes: many(quizzes),
    quizzSubmissions: many(quizzSubmissions), 
}));

// Table Accounts
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
);

// Table Sessions
export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }), 
    expires: timestamp("expires", { mode: "date" }).notNull(), 
});

// Table Quizzes
export const quizzes = pgTable("quizzes", {
    id: serial("id").primaryKey(), 
    name: text("name"), 
    description: text("description"), 
    userId: text("user_id").references(() => users.id), 
});

// Relation for table Quizzes
export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
    question: many(questions), 
    submissions: many(quizzSubmissions), 
    user: one(users, { 
        fields: [quizzes.userId],
        references: [users.id],
    }),
}));

// Enum for question types
export const questionTypeEnum = pgEnum("question_type", [
    "multiple_choice", 
    "write",           
    "listen",          
]);

//  Questions Table
export const questions = pgTable("questions", {
    id: serial("id").primaryKey(), 
    questionText: text("question_text"),
    quizzId: integer("quiz_id").references(() => quizzes.id), 
    type: questionTypeEnum("type").default("multiple_choice"), 
    audioText : text("audio_text"), 
    order: integer("order").notNull().default(0),
});

// Relations for Questions table
export const questionsRelations = relations(questions, ({ one, many }) => ({
    quizz: one(quizzes, {
        fields: [questions.quizzId],
        references: [quizzes.id],
    }),
    answers: many(questionAnswers), 
}));

// QuestionAnswers Table
export const questionAnswers = pgTable("question_answers", {
    id: serial("id").primaryKey(), 
    questionId: integer("question_id").references(() => questions.id), 
    answerText: text("answer_text"), 
    isCorrect: boolean("is_correct"), 
});

// Relations for QuestionAnswers table
export const questionAnswersRelations = relations(questionAnswers, ({ one }) => ({
    question: one(questions, {
        fields: [questionAnswers.questionId],
        references: [questions.id],
    }),
}));

// QuizzSubmissions Table
export const quizzSubmissions = pgTable("quizz_submissions", {
    id: serial("id").primaryKey(), 
    quizzId: integer("quizz_id").references(() => quizzes.id), 
    userId: text("user_id").references(() => users.id), 
    score: integer("score"), 
    createdAt: timestamp("created_at").defaultNow().notNull(), 
});

// Relations for QuizzSubmissions Table
export const quizzSubmissionsRelations = relations(quizzSubmissions,
    ({ one, many }) => ({
    quizz: one(quizzes, {
        fields: [quizzSubmissions.quizzId],
        references: [quizzes.id],
    }),
    user: one(users, {
        fields: [quizzSubmissions.userId],
        references: [users.id],
    }),
    userAnswers: many(userAnswers), 
}));

// UserAnswers Table
export const userAnswers = pgTable("user_answers", {
    id: serial("id").primaryKey(), 
    submissionId: integer("submission_id").references(() => quizzSubmissions.id, { onDelete: "cascade" }), 
    questionId: integer("question_id").references(() => questions.id), 
    selectedAnswerId: integer("selected_answer_id").references(() => questionAnswers.id), 
    userAnswerText: text("user_answer_text"),
    isCorrect: boolean("is_correct"), 
});

// Relations for UserAnswers Table
export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
    submission: one(quizzSubmissions, {
        fields: [userAnswers.submissionId],
        references: [quizzSubmissions.id],
    }),
    question: one(questions, {
        fields: [userAnswers.questionId],
        references: [questions.id],
    }),
    selectedAnswer: one(questionAnswers, {
        fields: [userAnswers.selectedAnswerId],
        references: [questionAnswers.id],
    }),
}));
