import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
        });

        if (!usuario) return null;

        const passwordCorrecta = await bcrypt.compare(
          credentials.password as string,
          usuario.password as string
        );

        if (!passwordCorrecta) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
});