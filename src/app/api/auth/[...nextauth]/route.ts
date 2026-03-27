/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateWithAD } from "@/lib/ldap";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Active Directory",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        
        const username = credentials.username.toLowerCase();
        console.log("Tentando login para:", username);

        try {
          // 1. Tenta autenticar no AD
          const adUser = await authenticateWithAD(
            username,
            credentials.password,
          );
          console.log("AD Autenticado com sucesso:", adUser);

          // 2. Busca ou cria o usuário no seu SQLite
          const user = await prisma.usuario.upsert({
            where: { login: adUser.login },
            update: { nome: adUser.nome },
            create: {
              login: adUser.login,
              nome: adUser.nome,
              guid: adUser.login,
            },
            include: { departamentos: true }
          });

          return {
            id: user.id.toString(),
            name: user.nome,
            email: user.perfil,
            isDeptoAdmin: user.departamentos.length > 0
          } as any;
        } catch (error) {
          console.error("Erro no LDAP:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.isDeptoAdmin = user.isDeptoAdmin;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        // Guardamos o ID real do banco na sessão para criar chamados depois
        session.user.id = token.sub;
        session.user.isDeptoAdmin = token.isDeptoAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "chameis_secret_123",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
