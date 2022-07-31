import { ShortLink } from "@prisma/client";
import { NextPage } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getBaseUrl } from "../../utils/link";
import { trpc } from "../../utils/trpc";

const shortLink = (slug: string) => `${getBaseUrl()}/${slug}`;

const List: NextPage = () => {
  const { data, isLoading, error, refetch } = trpc.proxy.link.links.useQuery();
  const { mutateAsync: updateUrlAsync, isLoading: updateUrlLoading } =
    trpc.proxy.link.updateUrl.useMutation({ onSuccess: () => refetch() });
  const { mutateAsync: deleteAsync, isLoading: deleteLoading } =
    trpc.proxy.link.delete.useMutation({ onSuccess: () => refetch() });

  const [editingId, setEditingId] = useState<number>();

  const EditUrl = useMemo(
    () =>
      function EditUrl({ link }: { link: ShortLink }) {
        const [newUrl, setNewUrl] = useState<string>(link.url);

        return (
          <div className="flex">
            <input
              type="url"
              className="rounded-md flex-1 bg-neutral-700"
              placeholder="Enter URL to shorten"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button
              className="p-2"
              disabled={updateUrlLoading}
              onClick={() => {
                toast.promise(
                  updateUrlAsync({ slug: link.slug, url: newUrl }),
                  {
                    loading: `Updating /${link.slug}...`,
                    error: `Failed to update /${link.slug}`,
                    success: `Updated /${link.slug}`,
                  }
                );
                setEditingId(undefined);
              }}
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button className="p-2" onClick={() => setEditingId(undefined)}>
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
        );
      },
    [updateUrlLoading, updateUrlAsync]
  );

  return (
    <div className="flex-1 flex justify-center items-center">
      <div className="w-[66vw] max-w-lg flex flex-col gap-5">
        <Link href="/">
          <a className="bg-indigo-700 p-2 rounded-md text-center">
            Back to home
          </a>
        </Link>

        <h1 className="text-3xl font-bold">Your links</h1>

        {isLoading && <div>Loading links...</div>}
        {error && <div>Error: {error.message}</div>}

        {data && (
          <ul className="flex flex-col divide-y">
            {data.map((link) => (
              <li key={link.id} className="py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>From: {shortLink(link.slug)}</p>
                    <p className="flex items-center gap-2">
                      <span>To:</span>
                      {editingId !== link.id && <span>{link.url}</span>}
                      {editingId === link.id && <EditUrl link={link} />}
                    </p>
                  </div>
                  {editingId !== link.id && (
                    <div className="flex gap-2">
                      <button
                        className="bg-indigo-700 rounded-md p-1"
                        onClick={() => setEditingId(link.id)}
                      >
                        Edit destination
                      </button>
                      <button
                        className="bg-red-700 rounded-md p-1"
                        disabled={deleteLoading}
                        onClick={() => {
                          toast.promise(
                            deleteAsync({
                              slug: link.slug,
                            }),
                            {
                              loading: `Deleting /${link.slug}...`,
                              error: `Failed to delete /${link.slug}`,
                              success: `Deleted /${link.slug}`,
                            }
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default List;
