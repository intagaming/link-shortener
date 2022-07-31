import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Link from "next/link";
import { FormEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { getBaseUrl } from "../utils/link";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

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
      setSlug("");
    },
  });
  const shortLink = useMemo(
    () => (data ? `${getBaseUrl()}/${data.slug}` : null),
    [data]
  );

  const [link, setLink] = useState<string>("");
  const [withSlug, setWithSlug] = useState(false);
  const [slug, setSlug] = useState<string>("");

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (link === "") return;
    newLinkMutate({ link, slug: withSlug ? slug : undefined });
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
    <>
      <NextSeo title="Link Shortener" description="Link Shortener." />

      <p>VERCEL_URL: {process.env.VERCEL_URL}</p>

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
              {!withSlug && (
                <button
                  className="bg-indigo-700 p-2 rounded-md"
                  onClick={() => setWithSlug(true)}
                >
                  Choose a slug
                </button>
              )}
              {withSlug && (
                <div className="flex-1 flex">
                  <input
                    type="text"
                    required
                    className="rounded-md flex-1 bg-neutral-700"
                    placeholder="Enter slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <button
                    className="p-2 text-red-700"
                    onClick={() => setWithSlug(false)}
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

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
            {isError && <p>Error: {error.message}</p>}

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
          <Link href="/manage/list">
            <a className="bg-indigo-700 rounded-md p-2 text-center">
              Manage your links
            </a>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
