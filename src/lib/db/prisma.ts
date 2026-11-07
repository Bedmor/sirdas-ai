import "dotenv/config";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../prisma/generated/client";
import {
  getLocalKnowledgeCorpus,
  isRemoteDbOffline,
  LocalKnowledgeChunk,
  markRemoteDbOffline,
} from "./local-corpus";

const globalForPrisma = globalThis as unknown as {
  realPrisma: PrismaClient | undefined;
  prismaProxy: PrismaClient | undefined;
  inMemoryDb: InMemoryDatabase | undefined;
  inMemoryKnowledgeChunks: Map<string, LocalKnowledgeChunk> | undefined;
};

interface InMemoryUser {
  id: string;
  phoneNumber: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
  profileMetadata: unknown;
  createdAt: Date;
  lastActiveAt: Date;
}

interface InMemoryMessage {
  id: string;
  waMessageId: string | null;
  userId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  jevMetadata: unknown;
  ragChunkIds: string[];
  editorAudit: unknown;
  audioSent: boolean;
  audioUrlSent: string | null;
  createdAt: Date;
}

interface InMemoryDonation {
  id: string;
  amount: number;
  currency: string;
  donorName: string | null;
  donorPhone: string | null;
  paymentProvider: string;
  providerTransactionId: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: Date;
}

interface InMemoryDatabase {
  users: Map<string, InMemoryUser>;
  messages: Map<string, InMemoryMessage>;
  donations: Map<string, InMemoryDonation>;
  knowledgeChunks: Map<string, LocalKnowledgeChunk>;
}

function getKnowledgeChunksMap(): Map<string, LocalKnowledgeChunk> {
  if (!globalForPrisma.inMemoryKnowledgeChunks) {
    const map = new Map<string, LocalKnowledgeChunk>();
    for (const chunk of getLocalKnowledgeCorpus()) {
      map.set(chunk.id, chunk);
    }
    globalForPrisma.inMemoryKnowledgeChunks = map;
  }
  return globalForPrisma.inMemoryKnowledgeChunks;
}

function getInMemoryDb(): InMemoryDatabase {
  if (!globalForPrisma.inMemoryDb) {
    globalForPrisma.inMemoryDb = {
      users: new Map(),
      messages: new Map(),
      donations: new Map(),
      get knowledgeChunks() {
        return getKnowledgeChunksMap();
      },
    };
  }
  return globalForPrisma.inMemoryDb;
}

function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "P2002") return false; // Unique constraint error is a business error, not connection failure
  const msg = String(e.message || "");
  return (
    e.code === "P2039" ||
    e.code === "P1001" ||
    e.code === "P1002" ||
    e.code === "XX000" ||
    e.code === "DB_TIMEOUT" ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("tenant/user") ||
    msg.includes("Can't reach database server") ||
    msg.includes("Connection terminated") ||
    msg.includes("timeout")
  );
}

function createUniqueConstraintError(field: string): Error & { code: string } {
  const err = new Error(
    `Unique constraint failed on the fields: (\`${field}\`)`
  ) as Error & { code: string };
  err.code = "P2002";
  return err;
}

async function runWithFallback<T>(
  realFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  if (isRemoteDbOffline()) {
    return await fallbackFn();
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutMs = process.env.DB_TIMEOUT_MS
      ? Number(process.env.DB_TIMEOUT_MS)
      : process.env.NODE_ENV === "test"
        ? 2500
        : 6000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const timeoutErr = new Error("Database connection timeout") as Error & {
          code: string;
        };
        timeoutErr.code = "DB_TIMEOUT";
        reject(timeoutErr);
      }, timeoutMs);
    });
    const realPromise = realFn();
    // Prevent unhandled rejection if realPromise rejects after timeoutPromise wins
    realPromise.catch(() => {});
    return await Promise.race([realPromise, timeoutPromise]);
  } catch (err) {
    if (isConnectionError(err)) {
      markRemoteDbOffline(30_000);
      return await fallbackFn();
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function matchStringCondition(
  val: string | null | undefined,
  cond: unknown
): boolean {
  const s = val ?? "";
  if (typeof cond === "string") return s === cond;
  if (cond && typeof cond === "object") {
    const c = cond as { contains?: string; mode?: string; in?: string[] };
    if (typeof c.contains === "string") {
      if (c.mode === "insensitive") {
        return s.toLowerCase().includes(c.contains.toLowerCase());
      }
      return s.includes(c.contains);
    }
    if (Array.isArray(c.in)) {
      return c.in.includes(s);
    }
  }
  return true;
}

function matchArrayCondition(arr: string[], cond: unknown): boolean {
  if (!cond || typeof cond !== "object") return true;
  const c = cond as { has?: string; hasSome?: string[] };
  if (typeof c.has === "string") {
    return arr.some((item) => item.toUpperCase() === c.has?.toUpperCase());
  }
  if (Array.isArray(c.hasSome)) {
    const upperSet = new Set(c.hasSome.map((x) => x.toUpperCase()));
    return arr.some((item) => upperSet.has(item.toUpperCase()));
  }
  return true;
}

function matchKnowledgeChunkWhere(
  chunk: LocalKnowledgeChunk,
  where: Record<string, unknown> | undefined
): boolean {
  if (!where) return true;

  if (Array.isArray(where.OR)) {
    const orMatched = (where.OR as Array<Record<string, unknown>>).some((sub) =>
      matchKnowledgeChunkWhere(chunk, sub)
    );
    if (!orMatched) return false;
  }

  if (Array.isArray(where.AND)) {
    const andMatched = (where.AND as Array<Record<string, unknown>>).every(
      (sub) => matchKnowledgeChunkWhere(chunk, sub)
    );
    if (!andMatched) return false;
  }

  if (
    where.id !== undefined &&
    !matchStringCondition(chunk.id, where.id)
  ) {
    return false;
  }

  if (
    where.sourceType !== undefined &&
    chunk.sourceType !== where.sourceType
  ) {
    return false;
  }

  if (
    where.isRibaRelated !== undefined &&
    chunk.isRibaRelated !== Boolean(where.isRibaRelated)
  ) {
    return false;
  }

  if (
    where.content !== undefined &&
    !matchStringCondition(chunk.content, where.content)
  ) {
    return false;
  }

  if (
    where.sourceTitle !== undefined &&
    !matchStringCondition(chunk.sourceTitle, where.sourceTitle)
  ) {
    return false;
  }

  if (
    where.tags !== undefined &&
    !matchArrayCondition(chunk.tags, where.tags)
  ) {
    return false;
  }

  if (
    where.nafsTraps !== undefined &&
    !matchArrayCondition(chunk.nafsTraps, where.nafsTraps)
  ) {
    return false;
  }

  return true;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});

const realPrisma =
  globalForPrisma.realPrisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.realPrisma = realPrisma;
}

function attachUserInclude(
  user: InMemoryUser | null,
  include?: Record<string, unknown>
): unknown {
  if (!user) return null;
  if (!include || !include.messages) return { ...user };

  const db = getInMemoryDb();
  let msgs = Array.from(db.messages.values()).filter(
    (m) => m.userId === user.id
  );
  const msgOpts =
    typeof include.messages === "object"
      ? (include.messages as {
          orderBy?: { createdAt?: "asc" | "desc" };
          take?: number;
        })
      : {};

  const dir = msgOpts?.orderBy?.createdAt === "asc" ? 1 : -1;
  msgs.sort(
    (a, b) => (a.createdAt.getTime() - b.createdAt.getTime()) * dir
  );
  if (typeof msgOpts?.take === "number") {
    msgs = msgs.slice(0, msgOpts.take);
  }
  return {
    ...user,
    messages: msgs,
  };
}

function createResilientPrisma(client: PrismaClient): PrismaClient {
  const userDelegate = {
    findUnique: (args: {
      where: { id?: string; phoneNumber?: string };
      include?: Record<string, unknown>;
    }) =>
      runWithFallback(
        () => (client.user.findUnique as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          let found: InMemoryUser | null = null;
          if (args?.where?.id) {
            found = db.users.get(args.where.id) || null;
          } else if (args?.where?.phoneNumber) {
            for (const u of db.users.values()) {
              if (u.phoneNumber === args.where.phoneNumber) {
                found = u;
                break;
              }
            }
          }
          return attachUserInclude(found, args?.include);
        }
      ),
    findFirst: (args?: {
      where?: { id?: string; phoneNumber?: string };
      include?: Record<string, unknown>;
    }) =>
      runWithFallback(
        () => (client.user.findFirst as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          for (const u of db.users.values()) {
            if (args?.where?.id && u.id !== args.where.id) continue;
            if (
              args?.where?.phoneNumber &&
              u.phoneNumber !== args.where.phoneNumber
            )
              continue;
            return attachUserInclude(u, args?.include);
          }
          return null;
        }
      ),
    findMany: (args?: {
      where?: {
        id?: string;
        phoneNumber?: string | { startsWith?: string };
        lastActiveAt?: { lt?: Date };
      };
      take?: number;
      include?: Record<string, unknown>;
    }) =>
      runWithFallback(
        () =>
          (client.user.findMany as (a?: unknown) => Promise<unknown[]>)(args),
        () => {
          const db = getInMemoryDb();
          let list = Array.from(db.users.values());
          if (args?.where?.phoneNumber) {
            if (typeof args.where.phoneNumber === "string") {
              list = list.filter(
                (u) => u.phoneNumber === args.where?.phoneNumber
              );
            } else if (args.where.phoneNumber.startsWith) {
              const prefix = args.where.phoneNumber.startsWith;
              list = list.filter((u) => u.phoneNumber.startsWith(prefix));
            }
          }
          if (args?.where?.lastActiveAt?.lt) {
            const cutoff = args.where.lastActiveAt.lt.getTime();
            list = list.filter((u) => u.lastActiveAt.getTime() < cutoff);
          }
          if (typeof args?.take === "number") {
            list = list.slice(0, args.take);
          }
          return list.map((u) => attachUserInclude(u, args?.include));
        }
      ),
    create: (args: { data: Partial<InMemoryUser> & { phoneNumber: string } }) =>
      runWithFallback(
        () => (client.user.create as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          for (const u of db.users.values()) {
            if (u.phoneNumber === args.data.phoneNumber) {
              throw createUniqueConstraintError("phoneNumber");
            }
          }
          const now = new Date();
          const newUser: InMemoryUser = {
            id: args.data.id || crypto.randomUUID(),
            phoneNumber: args.data.phoneNumber,
            onboardingStep: args.data.onboardingStep ?? 1,
            onboardingCompleted: args.data.onboardingCompleted ?? false,
            profileMetadata: args.data.profileMetadata ?? {},
            createdAt: args.data.createdAt || now,
            lastActiveAt: args.data.lastActiveAt || now,
          };
          db.users.set(newUser.id, newUser);
          return { ...newUser };
        }
      ),
    update: (args: {
      where: { id?: string; phoneNumber?: string };
      data: Partial<InMemoryUser>;
    }) =>
      runWithFallback(
        () => (client.user.update as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          let target: InMemoryUser | undefined;
          if (args.where.id) {
            target = db.users.get(args.where.id);
          } else if (args.where.phoneNumber) {
            for (const u of db.users.values()) {
              if (u.phoneNumber === args.where.phoneNumber) {
                target = u;
                break;
              }
            }
          }
          if (!target) {
            const now = new Date();
            target = {
              id: args.where.id || crypto.randomUUID(),
              phoneNumber:
                args.where.phoneNumber || `user_${crypto.randomUUID()}`,
              onboardingStep: 1,
              onboardingCompleted: false,
              profileMetadata: {},
              createdAt: now,
              lastActiveAt: now,
            };
          }
          const updated: InMemoryUser = {
            ...target,
            ...(args.data.phoneNumber !== undefined
              ? { phoneNumber: args.data.phoneNumber }
              : {}),
            ...(args.data.onboardingStep !== undefined
              ? { onboardingStep: args.data.onboardingStep }
              : {}),
            ...(args.data.onboardingCompleted !== undefined
              ? { onboardingCompleted: args.data.onboardingCompleted }
              : {}),
            ...(args.data.profileMetadata !== undefined
              ? { profileMetadata: args.data.profileMetadata }
              : {}),
            ...(args.data.lastActiveAt !== undefined
              ? { lastActiveAt: args.data.lastActiveAt }
              : {}),
          };
          db.users.set(updated.id, updated);
          return { ...updated };
        }
      ),
    upsert: (args: {
      where: { id?: string; phoneNumber?: string };
      create: Partial<InMemoryUser> & { phoneNumber: string };
      update: Partial<InMemoryUser>;
    }) =>
      runWithFallback(
        () => (client.user.upsert as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          let existing: InMemoryUser | undefined;
          if (args.where.id) {
            existing = db.users.get(args.where.id);
          } else if (args.where.phoneNumber) {
            for (const u of db.users.values()) {
              if (u.phoneNumber === args.where.phoneNumber) {
                existing = u;
                break;
              }
            }
          }
          if (existing) {
            const updated: InMemoryUser = {
              ...existing,
              ...(args.update.onboardingStep !== undefined
                ? { onboardingStep: args.update.onboardingStep }
                : {}),
              ...(args.update.onboardingCompleted !== undefined
                ? { onboardingCompleted: args.update.onboardingCompleted }
                : {}),
              ...(args.update.profileMetadata !== undefined
                ? { profileMetadata: args.update.profileMetadata }
                : {}),
              ...(args.update.lastActiveAt !== undefined
                ? { lastActiveAt: args.update.lastActiveAt }
                : {}),
            };
            db.users.set(updated.id, updated);
            return { ...updated };
          }
          const now = new Date();
          const created: InMemoryUser = {
            id: args.create.id || crypto.randomUUID(),
            phoneNumber: args.create.phoneNumber,
            onboardingStep: args.create.onboardingStep ?? 1,
            onboardingCompleted: args.create.onboardingCompleted ?? false,
            profileMetadata: args.create.profileMetadata ?? {},
            createdAt: now,
            lastActiveAt: now,
          };
          db.users.set(created.id, created);
          return { ...created };
        }
      ),
    delete: (args: { where: { id?: string; phoneNumber?: string } }) =>
      runWithFallback(
        () => (client.user.delete as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          let targetId: string | undefined;
          if (args?.where?.id) {
            targetId = args.where.id;
          } else if (args?.where?.phoneNumber) {
            for (const [id, u] of db.users.entries()) {
              if (u.phoneNumber === args.where.phoneNumber) {
                targetId = id;
                break;
              }
            }
          }
          if (targetId) {
            const user = db.users.get(targetId);
            db.users.delete(targetId);
            // Cascade delete messages for user
            for (const [mId, m] of db.messages.entries()) {
              if (m.userId === targetId) {
                db.messages.delete(mId);
              }
            }
            return user ? { ...user } : null;
          }
          return null;
        }
      ),
    deleteMany: (args?: { where?: { id?: string; phoneNumber?: string } }) =>
      runWithFallback(
        () =>
          (client.user.deleteMany as (a?: unknown) => Promise<{ count: number }>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          let count = 0;
          for (const [id, u] of db.users.entries()) {
            if (args?.where?.id && u.id !== args.where.id) continue;
            if (
              args?.where?.phoneNumber &&
              u.phoneNumber !== args.where.phoneNumber
            )
              continue;
            db.users.delete(id);
            for (const [mId, m] of db.messages.entries()) {
              if (m.userId === id) {
                db.messages.delete(mId);
              }
            }
            count++;
          }
          return { count };
        }
      ),
    count: (args?: unknown) =>
      runWithFallback(
        () => (client.user.count as (a?: unknown) => Promise<number>)(args),
        () => {
          const db = getInMemoryDb();
          return db.users.size;
        }
      ),
  };

  const messageDelegate = {
    findUnique: (args: { where: { id?: string; waMessageId?: string } }) =>
      runWithFallback(
        () =>
          (client.message.findUnique as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          if (args?.where?.id) {
            return db.messages.get(args.where.id) || null;
          }
          if (args?.where?.waMessageId) {
            for (const m of db.messages.values()) {
              if (m.waMessageId === args.where.waMessageId) {
                return { ...m };
              }
            }
          }
          return null;
        }
      ),
    findMany: (args?: {
      where?: { userId?: string; role?: string };
      take?: number;
      orderBy?: { createdAt?: "asc" | "desc" };
      include?: { user?: boolean | { select?: { phoneNumber?: boolean } } };
    }) =>
      runWithFallback(
        () =>
          (client.message.findMany as (a: unknown) => Promise<unknown[]>)(args),
        () => {
          const db = getInMemoryDb();
          let list = Array.from(db.messages.values());
          if (args?.where?.userId) {
            list = list.filter((m) => m.userId === args.where?.userId);
          }
          if (args?.where?.role) {
            list = list.filter((m) => m.role === args.where?.role);
          }
          const dir = args?.orderBy?.createdAt === "asc" ? 1 : -1;
          list.sort(
            (a, b) => (a.createdAt.getTime() - b.createdAt.getTime()) * dir
          );
          if (typeof args?.take === "number") {
            list = list.slice(0, args.take);
          }
          return list.map((m) => {
            if (args?.include?.user) {
              const u = db.users.get(m.userId);
              return {
                ...m,
                user: u
                  ? {
                      phoneNumber: u.phoneNumber,
                      profileMetadata: u.profileMetadata,
                      onboardingStep: u.onboardingStep,
                      onboardingCompleted: u.onboardingCompleted,
                    }
                  : null,
              };
            }
            return { ...m };
          });
        }
      ),
    create: (args: {
      data: {
        id?: string;
        waMessageId?: string | null;
        userId: string;
        role: "USER" | "ASSISTANT" | "SYSTEM";
        content: string;
        jevMetadata?: unknown;
        ragChunkIds?: string[];
        editorAudit?: unknown;
        audioSent?: boolean;
        audioUrlSent?: string | null;
      };
    }) =>
      runWithFallback(
        () => (client.message.create as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          if (args.data.waMessageId) {
            for (const m of db.messages.values()) {
              if (m.waMessageId === args.data.waMessageId) {
                throw createUniqueConstraintError("waMessageId");
              }
            }
          }
          const msg: InMemoryMessage = {
            id: args.data.id || crypto.randomUUID(),
            waMessageId: args.data.waMessageId ?? null,
            userId: args.data.userId,
            role: args.data.role,
            content: args.data.content,
            jevMetadata: args.data.jevMetadata ?? null,
            ragChunkIds: args.data.ragChunkIds ?? [],
            editorAudit: args.data.editorAudit ?? null,
            audioSent: args.data.audioSent ?? false,
            audioUrlSent: args.data.audioUrlSent ?? null,
            createdAt: new Date(),
          };
          db.messages.set(msg.id, msg);
          return { ...msg };
        }
      ),
    update: (args: {
      where: { id: string };
      data: Partial<InMemoryMessage>;
    }) =>
      runWithFallback(
        () => (client.message.update as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          const existing = db.messages.get(args.where.id);
          if (!existing) return null;
          const updated: InMemoryMessage = {
            ...existing,
            ...(args.data.content !== undefined
              ? { content: args.data.content }
              : {}),
            ...(args.data.jevMetadata !== undefined
              ? { jevMetadata: args.data.jevMetadata }
              : {}),
            ...(args.data.ragChunkIds !== undefined
              ? { ragChunkIds: args.data.ragChunkIds }
              : {}),
            ...(args.data.editorAudit !== undefined
              ? { editorAudit: args.data.editorAudit }
              : {}),
            ...(args.data.audioSent !== undefined
              ? { audioSent: args.data.audioSent }
              : {}),
            ...(args.data.audioUrlSent !== undefined
              ? { audioUrlSent: args.data.audioUrlSent }
              : {}),
          };
          db.messages.set(updated.id, updated);
          return { ...updated };
        }
      ),
    deleteMany: (args?: { where?: { userId?: string } }) =>
      runWithFallback(
        () =>
          (client.message.deleteMany as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          let count = 0;
          for (const [id, m] of db.messages.entries()) {
            if (!args?.where?.userId || m.userId === args.where.userId) {
              db.messages.delete(id);
              count++;
            }
          }
          return { count };
        }
      ),
    count: (args?: { where?: { userId?: string } }) =>
      runWithFallback(
        () => (client.message.count as (a?: unknown) => Promise<number>)(args),
        () => {
          const db = getInMemoryDb();
          if (args?.where?.userId) {
            let userCount = 0;
            for (const m of db.messages.values()) {
              if (m.userId === args.where.userId) userCount++;
            }
            return userCount;
          }
          return db.messages.size;
        }
      ),
  };

  const knowledgeChunkDelegate = {
    findMany: (args?: {
      where?: Record<string, unknown>;
      take?: number;
      orderBy?: unknown;
    }) =>
      runWithFallback(
        () =>
          (
            client.knowledgeChunk.findMany as (a: unknown) => Promise<unknown[]>
          )(args),
        () => {
          const db = getInMemoryDb();
          let chunks = Array.from(db.knowledgeChunks.values()).filter((c) =>
            matchKnowledgeChunkWhere(c, args?.where)
          );
          if (typeof args?.take === "number") {
            chunks = chunks.slice(0, args.take);
          }
          return chunks.map((c) => ({ ...c }));
        }
      ),
    findFirst: (args?: { where?: Record<string, unknown> }) =>
      runWithFallback(
        () =>
          (client.knowledgeChunk.findFirst as (a: unknown) => Promise<unknown>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          for (const c of db.knowledgeChunks.values()) {
            if (matchKnowledgeChunkWhere(c, args?.where)) {
              return { ...c };
            }
          }
          return null;
        }
      ),
    count: (args?: unknown) =>
      runWithFallback(
        () =>
          (client.knowledgeChunk.count as (a?: unknown) => Promise<number>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          return db.knowledgeChunks.size;
        }
      ),
    deleteMany: (args?: { where?: Record<string, unknown> }) =>
      runWithFallback(
        () =>
          (client.knowledgeChunk.deleteMany as (a?: unknown) => Promise<{ count: number }>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          let count = 0;
          for (const [id, c] of db.knowledgeChunks.entries()) {
            if (matchKnowledgeChunkWhere(c, args?.where)) {
              db.knowledgeChunks.delete(id);
              count++;
            }
          }
          return { count };
        }
      ),
  };

  const donationDelegate = {
    create: (args: {
      data: Partial<InMemoryDonation> & {
        amount: number;
        paymentProvider: string;
      };
    }) =>
      runWithFallback(
        () =>
          (client.donation.create as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          const d: InMemoryDonation = {
            id: args.data.id || crypto.randomUUID(),
            amount: Number(args.data.amount),
            currency: args.data.currency || "TRY",
            donorName: args.data.donorName ?? null,
            donorPhone: args.data.donorPhone ?? null,
            paymentProvider: args.data.paymentProvider,
            providerTransactionId: args.data.providerTransactionId ?? null,
            status: args.data.status || "PENDING",
            createdAt: new Date(),
          };
          db.donations.set(d.id, d);
          return { ...d };
        }
      ),
    update: (args: {
      where: { id: string };
      data: Partial<InMemoryDonation>;
    }) =>
      runWithFallback(
        () =>
          (client.donation.update as (a: unknown) => Promise<unknown>)(args),
        () => {
          const db = getInMemoryDb();
          const existing = db.donations.get(args.where.id);
          const updated: InMemoryDonation = {
            ...(existing || {
              id: args.where.id,
              amount: 250,
              currency: "TRY",
              donorName: "Gönüllü İnfak Sahibi",
              donorPhone: null,
              paymentProvider: "PAYTR",
              providerTransactionId: null,
              status: "PENDING",
              createdAt: new Date(),
            }),
            ...args.data,
          };
          db.donations.set(updated.id, updated);
          return { ...updated };
        }
      ),
    updateMany: (args: {
      where?: Record<string, unknown>;
      data: Partial<InMemoryDonation>;
    }) =>
      runWithFallback(
        () =>
          (client.donation.updateMany as (a: unknown) => Promise<unknown>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          let count = 0;
          for (const [id, d] of db.donations.entries()) {
            db.donations.set(id, { ...d, ...args.data });
            count++;
          }
          return { count };
        }
      ),
    findMany: (args?: { take?: number }) =>
      runWithFallback(
        () =>
          (client.donation.findMany as (a: unknown) => Promise<unknown[]>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          const list = Array.from(db.donations.values()).sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          );
          return typeof args?.take === "number"
            ? list.slice(0, args.take)
            : list;
        }
      ),
    aggregate: (args?: unknown) =>
      runWithFallback(
        () =>
          (client.donation.aggregate as (a?: unknown) => Promise<unknown>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          let sum = 0;
          let count = 0;
          for (const d of db.donations.values()) {
            if (d.status === "SUCCESS") {
              sum += d.amount;
              count++;
            }
          }
          return {
            _sum: { amount: count > 0 ? sum : null },
            _count: { id: count },
          };
        }
      ),
    deleteMany: (args?: { where?: Record<string, unknown> }) =>
      runWithFallback(
        () =>
          (client.donation.deleteMany as (a?: unknown) => Promise<{ count: number }>)(
            args
          ),
        () => {
          const db = getInMemoryDb();
          const count = db.donations.size;
          db.donations.clear();
          return { count };
        }
      ),
    count: (args?: { where?: Record<string, unknown> }) =>
      runWithFallback(
        () => (client.donation.count as (a?: unknown) => Promise<number>)(args),
        () => {
          const db = getInMemoryDb();
          return db.donations.size;
        }
      ),
  };

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "user") return userDelegate;
      if (prop === "message") return messageDelegate;
      if (prop === "knowledgeChunk") return knowledgeChunkDelegate;
      if (prop === "donation") return donationDelegate;
      if (prop === "$transaction") {
        return async (arg: unknown) => {
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          if (typeof arg === "function") {
            return arg(receiver);
          }
          return [];
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prismaProxy ?? createResilientPrisma(realPrisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaProxy = prisma;
}

export default prisma;
export * from "../../../prisma/generated/client";
