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

// Bảng Users: Lưu trữ thông tin người dùng
export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()), // ID duy nhất cho mỗi người dùng
    name: text("name"), // Tên người dùng
    email: text("email").unique(), // Email người dùng, phải là duy nhất
    emailVerified: timestamp("emailVerified", { mode: "date" }), // Thời gian xác minh email
    image: text("image"), // URL ảnh đại diện
    stripeCustomerId: text("stripe_customer_id"), // ID khách hàng Stripe (nếu có)
    subscribed: boolean("subscribed"), // Trạng thái đăng ký (ví dụ: trả phí)
});

// Quan hệ cho bảng Users: Một người dùng có thể có nhiều bài kiểm tra và nhiều lượt nộp bài
export const usersRelations = relations(users, ({ many }) => ({
    quizzes: many(quizzes), // Một người dùng tạo nhiều bài kiểm tra
    quizzSubmissions: many(quizzSubmissions), // Một người dùng có nhiều lượt nộp bài kiểm tra
}));

// Bảng Accounts: Liên kết tài khoản người dùng với các nhà cung cấp OAuth
export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }), // Khóa ngoại đến users.id, xóa cascade
        type: text("type").notNull(), // Loại tài khoản (ví dụ: "oauth")
        provider: text("provider").notNull(), // Nhà cung cấp (ví dụ: "google", "github")
        providerAccountId: text("providerAccountId").notNull(), // ID tài khoản của nhà cung cấp
        refresh_token: text("refresh_token"), // Refresh token
        access_token: text("access_token"), // Access token
        expires_at: integer("expires_at"), // Thời gian hết hạn của token
        token_type: text("token_type"), // Loại token
        scope: text("scope"), // Phạm vi quyền truy cập
        id_token: text("id_token"), // ID token
        session_state: text("session_state"), // Trạng thái phiên
    },
    (account) => [
        {
            // Khóa chính phức hợp để đảm bảo tính duy nhất cho mỗi tài khoản từ một nhà cung cấp
            compoundKey: primaryKey({
                columns: [account.provider, account.providerAccountId],
            }),
        },
    ]
);

// Bảng Sessions: Quản lý phiên đăng nhập của người dùng
export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(), // Token phiên, khóa chính
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }), // Khóa ngoại đến users.id, xóa cascade
    expires: timestamp("expires", { mode: "date" }).notNull(), // Thời gian hết hạn của phiên
});

// Bảng Quizzes: Lưu trữ thông tin về các bài kiểm tra
export const quizzes = pgTable("quizzes", {
    id: serial("id").primaryKey(), // ID bài kiểm tra, tự động tăng
    name: text("name"), // Tên bài kiểm tra
    description: text("description"), // Mô tả bài kiểm tra
    userId: text("user_id").references(() => users.id), // ID người dùng tạo bài kiểm tra
});

// Quan hệ cho bảng Quizzes: Một bài kiểm tra có nhiều câu hỏi và nhiều lượt nộp bài
export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
    question: many(questions), // Một bài kiểm tra có nhiều câu hỏi
    submissions: many(quizzSubmissions), // Một bài kiểm tra có nhiều lượt nộp bài
    user: one(users, { // Một bài kiểm tra thuộc về một người dùng
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
