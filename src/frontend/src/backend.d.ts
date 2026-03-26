import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Doubt {
    studentId: Principal;
    text: string;
    isResolved: boolean;
    reply?: string;
}
export type Time = bigint;
export interface Notification {
    userId: Principal;
    notificationType: string;
    isRead: boolean;
    message: string;
}
export interface Feedback {
    studentId: Principal;
    text: string;
    rating: bigint;
}
export interface Quiz {
    title: string;
    questions: Array<Question>;
}
export interface Answer {
    questionIndex: bigint;
    selectedOption: bigint;
}
export interface Question {
    correctIndex: bigint;
    text: string;
    options: Array<string>;
}
export interface Profile {
    username: string;
    role: Role;
}
export interface Poll {
    question: string;
    voteCounts: Array<bigint>;
    options: Array<string>;
}
export interface AttendanceRecord {
    isPresent: boolean;
    date: Time;
}
export enum Role {
    teacher = "teacher",
    student = "student"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addNotification(userId: Principal, message: string, notificationType: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPoll(question: string, options: Array<string>): Promise<bigint>;
    createQuiz(title: string, questions: Array<Question>): Promise<bigint>;
    getAllDoubts(): Promise<Array<Doubt>>;
    getAllFeedback(): Promise<Array<Feedback>>;
    getAttendanceHistory(studentId: Principal | null): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClassAttendance(): Promise<Array<[Principal, Array<AttendanceRecord>]>>;
    getGameLeaderboard(): Promise<Array<[Principal, number]>>;
    getLeaderboard(): Promise<Array<Profile>>;
    getMyDoubts(): Promise<Array<Doubt>>;
    getNotifications(): Promise<Array<Notification>>;
    getPolls(): Promise<Array<Poll>>;
    getQuizzes(): Promise<Array<Quiz>>;
    getStudents(): Promise<Array<Profile>>;
    getUserProfile(userId: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(studentId: Principal, isPresent: boolean): Promise<void>;
    markDoubtResolved(doubtId: bigint): Promise<void>;
    markNotificationsAsRead(): Promise<void>;
    registerUser(username: string, role: Role): Promise<void>;
    replyDoubt(doubtId: bigint, reply: string): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    submitDoubt(text: string): Promise<bigint>;
    submitFeedback(text: string, rating: bigint): Promise<bigint>;
    submitGameScore(points: number): Promise<void>;
    submitQuizAnswers(quizId: bigint, answers: Array<Answer>): Promise<bigint>;
    votePoll(pollId: bigint, optionIndex: bigint): Promise<void>;
}
