import 'server-only';
import { PrismaClient } from '@prisma/client';

// Plain client used only for audit log writes inside the extension callback,
// avoids a recursive extended-type loop that confuses the TypeScript checker.
const auditPrisma = new PrismaClient();

const prismaClientSingleton = () => {
    return new PrismaClient().$extends({
        query: {
            $allModels: {
                async $allOperations({ operation, model, args, query }) {
                    // 1. Soft Delete functionality
                    const modelsWithSoftDelete = ['Student', 'Teacher', 'FeeChallan', 'IncomeRecord', 'ExpenseRecord', 'Attendance'];

                    if (model && modelsWithSoftDelete.includes(model)) {
                        if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany') {
                            args.where = { ...args.where, deletedAt: null };
                        }
                    }

                    // 2. Audit Logging on mutations - Asynchronous Fire-and-Forget
                    const isMutation = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'].includes(operation);

                    const result = await query(args);

                    if (isMutation && model) {
                        Promise.resolve().then(async () => {
                            try {
                                const { getSession } = await import('./session');
                                const session = await getSession();
                                if (session && session.userId && session.schoolId) {
                                    await auditPrisma.auditLog.create({
                                        data: {
                                            schoolId: session.schoolId,
                                            action: `${operation}_${model}`,
                                            targetId: (result as any)?.id || 'bulk_or_unknown',
                                            targetType: model,
                                            actorId: session.userId,
                                            actorType: session.role || 'Unknown',
                                        }
                                    });
                                }
                            } catch {
                                // Swallow error to prevent async crash
                            }
                        });
                    }

                    return result;
                }
            }
        }
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db;
