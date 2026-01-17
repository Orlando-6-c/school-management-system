import db from '@/lib/db';

export async function createAuditLogEntry(
    session: { schoolId?: string | null; userId?: string | null; role?: string | null },
    action: string,
    targetId: string,
    targetType: string,
    reason?: string,
    tx?: any // Optional transaction client
) {
    if (!session.schoolId || !session.userId) return;

    const prisma = tx || db;

    try {
        await prisma.auditLog.create({
            data: {
                schoolId: session.schoolId,
                actorId: session.userId,
                actorType: 'User', // Assuming generic User for now
                action: action,
                targetId: targetId,
                targetType: targetType,
                reason: reason,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log entry:', error);
        // Don't throw, just log failure to avoid blocking main action
    }
}
