// src/pages/_app.tsx
import "../styles/globals.css";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import type { AppType } from "next/dist/shared/lib/utils";
import { trpc } from "../utils/trpc";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

const Layout = ({ children }: { children: ReactNode }) => {
  const { data: session, status: sessionStatus } = useSession();

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      {sessionStatus === "loading" && <div>Loading user info...</div>}

      {sessionStatus === "authenticated" && (
        <div className="flex gap-2">
          <p>Hi {session.user?.name ?? "there"}.</p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      )}

      {children}

      <Toaster />
    </div>
  );
};

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
