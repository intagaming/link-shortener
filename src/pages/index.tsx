import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { FormEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }
  return { props: {} };
};

const Home: NextPage = () => {
  const { data: session, status: sessionStatus } = useSession();

  const {
    mutate: newLinkMutate,
    isLoading,
    error,
    isSuccess,
    isError,
    data,
  } = trpc.proxy.link.newLink.useMutation({
    onSuccess: () => {
      setLink("");
    },
  });
  const shortLink = useMemo(
    () => (data ? `${getBaseUrl()}/${data.id}` : null),
    [data]
  );

  const [link, setLink] = useState<string>("");

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (link === "") return;
    newLinkMutate({ link });
  };

  const [checkIcon, setCheckIcon] = useState(false);
  useEffect(() => {
    if (!checkIcon) return;

    const timer = setTimeout(() => {
      setCheckIcon(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [checkIcon]);

  const handleCopy = () => {
    if (!shortLink) return;
    navigator.clipboard.writeText(shortLink);
    setCheckIcon(true);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      {sessionStatus === "loading" && <div>Loading user info...</div>}
      {sessionStatus === "authenticated" && (
        <div className="flex gap-2">
          <p>Hi {session.user?.name ?? "there"}.</p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      )}
      <div className="flex-1 flex justify-center items-center">
        <div className="w-[66vw] max-w-lg flex flex-col gap-5">
          <div className="rounded-md">
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <input
                type="url"
                className="rounded-md flex-1 bg-neutral-700"
                placeholder="Enter URL to shorten"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />

              <button
                type="submit"
                className="p-2 bg-indigo-700 disabled:bg-indigo-900 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? "Shortening..." : "Shorten"}
              </button>
            </form>
          </div>

          <div>
            {isSuccess && shortLink && (
              <p>
                {data.url} is shortened to <a href={shortLink}>{shortLink}</a>
              </p>
            )}
            {isError && <p>{error.message}</p>}
            <div className="bg-neutral-700 relative rounded-md">
              <input
                type="text"
                className="rounded-md w-full bg-neutral-700"
                placeholder="Your shortened URL will display here."
                value={shortLink ?? undefined}
              />
              <button
                className="absolute right-0 h-full aspect-square hover:bg-neutral-500 hover:bg-opacity-50 rounded-md"
                onClick={handleCopy}
              >
                <div className="flex justify-center">
                  {checkIcon ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          <p>{error ? error.message : ""}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
