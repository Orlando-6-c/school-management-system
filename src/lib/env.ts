import { z } from 'zod';

/**
 * Centralised, validated environment configuration.
 *
 * Importing this module validates `process.env` against the schema below and
 * throws immediately (fail-fast) if anything required is missing or malformed.
 * Every other module should read env values from the exported `env` object
 * instead of touching `process.env` directly.
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // PostgreSQL connection string used by Prisma.
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // iron-session cookie encryption secret. Must be at least 32 chars.
    SESSION_SECRET: z
        .string()
        .min(32, 'SESSION_SECRET must be at least 32 characters long'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
            .join('\n');
        throw new Error(
            `\n❌ Invalid environment configuration:\n${issues}\n\n` +
                `Copy .env.example to .env and fill in the required values.\n`
        );
    }

    return parsed.data;
}

export const env = loadEnv();
