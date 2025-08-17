import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { nextAuthUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db) as any, // Type assertion needed for compatibility
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("[NEXTAUTH ERROR]", code, metadata);
    },
    warn(code) {
      console.warn("[NEXTAUTH WARN]", code);
    },
    debug(code, metadata) {
      console.log("[NEXTAUTH DEBUG]", code, metadata);
    },
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "text" }
      },
      async authorize(credentials) {
        console.log("[CREDENTIALS AUTH] Starting authorization with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          action: credentials?.action
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("[CREDENTIALS AUTH] Missing email or password");
          return null;
        }

        const { email, password, action } = credentials;

        try {
          if (action === "signup") {
            console.log("[CREDENTIALS AUTH] Processing signup for:", email);
            
            const existingUser = await db
              .select()
              .from(nextAuthUsers)
              .where(eq(nextAuthUsers.email, email))
              .limit(1);

            console.log("[CREDENTIALS AUTH] Existing user check result:", existingUser.length > 0);

            if (existingUser.length > 0) {
              console.log("[CREDENTIALS AUTH] User already exists, throwing error");
              throw new Error("User already exists");
            }

            console.log("[CREDENTIALS AUTH] Hashing password...");
            const hashedPassword = await bcrypt.hash(password, 12);
            
            console.log("[CREDENTIALS AUTH] Creating new user...");
            const newUser = await db
              .insert(nextAuthUsers)
              .values({
                email,
                password: hashedPassword,
                emailVerified: new Date(),
              })
              .returning();

            console.log("[CREDENTIALS AUTH] User created successfully:", {
              id: newUser[0].id,
              email: newUser[0].email
            });

            return {
              id: newUser[0].id,
              email: newUser[0].email,
              name: newUser[0].name,
            };
          }

          if (action === "signin") {
            console.log("[CREDENTIALS AUTH] Processing signin for:", email);
            
            const user = await db
              .select()
              .from(nextAuthUsers)
              .where(eq(nextAuthUsers.email, email))
              .limit(1);

            console.log("[CREDENTIALS AUTH] User lookup result:", {
              found: user.length > 0,
              hasPassword: user.length > 0 ? !!user[0].password : false
            });

            if (user.length === 0 || !user[0].password) {
              console.log("[CREDENTIALS AUTH] User not found or no password");
              return null;
            }

            console.log("[CREDENTIALS AUTH] Comparing passwords...");
            const isPasswordValid = await bcrypt.compare(password, user[0].password);
            
            console.log("[CREDENTIALS AUTH] Password validation result:", isPasswordValid);

            if (!isPasswordValid) {
              console.log("[CREDENTIALS AUTH] Invalid password");
              return null;
            }

            console.log("[CREDENTIALS AUTH] Signin successful for:", email);
            return {
              id: user[0].id,
              email: user[0].email,
              name: user[0].name,
            };
          }

          console.log("[CREDENTIALS AUTH] Unknown action:", action);
          return null;
        } catch (error) {
          console.error("[CREDENTIALS AUTH] Error during authorization:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/sessions/create",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  // Note: User creation is handled by the DrizzleAdapter
};