import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };

        const usuario = await prisma.usuario.findUnique({
          where: { email },
        });

        if (!usuario || !usuario.activo) return null;

        const ok = await bcrypt.compare(password, usuario.password);
        if (!ok) return null;

        // Para superadmin usar empresaActivaId si existe
        const empresaId = usuario.rol === "superadmin"
          ? usuario.empresaActivaId
          : usuario.empresaId;

        return {
          id:        usuario.id,
          name:      usuario.nombre,
          email:     usuario.email,
          rol:       usuario.rol,
          empresaId: empresaId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id        = user.id;
        token.rol       = (user as any).rol;
        token.empresaId = (user as any).empresaId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id as string;
        (session.user as any).rol       = token.rol;
        (session.user as any).empresaId = token.empresaId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});