const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
    // Update this email to YOUR email
    const email = 'admin@school.com'; // Default from seed, prompt user to change if needed

    console.log(`Attempting to promote user with email: ${email}...`);

    try {
        const user = await db.user.findFirst({
            where: { username: email } // In seed.ts, username is set to email
        });

        if (!user) {
            console.error(`User with username/email '${email}' not found.`);
            return;
        }

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: { role: 'SuperAdmin' }
        });

        console.log(`Success! User '${updatedUser.username}' is now a SuperAdmin.`);

    } catch (error) {
        console.error("Error promoting user:", error);
    } finally {
        await db.$disconnect();
    }
}

main();
