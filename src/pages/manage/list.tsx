import { ShortLink } from "@prisma/client";
import algoliasearch from "algoliasearch";
import { Hit } from "instantsearch.js";
import { NextPage } from "next";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Highlight,
  InfiniteHits,
  InstantSearch,
  SearchBox,
} from "react-instantsearch-hooks-web";
import { getBaseUrl } from "../../utils/link";
import { trpc } from "../../utils/trpc";

const shortLink = (slug: string) => `${getBaseUrl()}/${slug}`;

type AlgoliaLink = Pick<ShortLink, "slug" | "url" | "userId"> & {
  objectID: string;
};
type AlgoliaLinkHit = Hit<AlgoliaLink>;

const List: NextPage = () => {
  const { data, isLoading, error, refetch } = trpc.proxy.link.links.useQuery();
  const { mutateAsync: updateUrlAsync, isLoading: updateUrlLoading } =
    trpc.proxy.link.updateUrl.useMutation({ onSuccess: () => refetch() });
  const { mutateAsync: deleteAsync, isLoading: deleteLoading } =
    trpc.proxy.link.delete.useMutation({ onSuccess: () => refetch() });
  const { data: searchApiKey, isLoading: isLoadingSearchApiKey } =
    trpc.proxy.link.searchApiKey.useQuery();
  const searchClient = useMemo(
    () =>
      searchApiKey
        ? algoliasearch(searchApiKey.appId, searchApiKey.privateSearchKey)
        : undefined,
    [searchApiKey]
  );

  const [editingId, setEditingId] = useState<string>();

  const EditUrl = useMemo(
    () =>
      function EditUrl({ link }: { link: AlgoliaLinkHit }) {
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

  const Hit = useMemo(
    () =>
      function Hit({ hit }: { hit: AlgoliaLinkHit }) {
        return (
          <div className="py-4 border-l-8 border-indigo-700 px-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <p>
                  From: {getBaseUrl()}/<Highlight attribute="slug" hit={hit} />
                </p>
                <div className="flex items-center gap-2">
                  <span>To:</span>
                  {editingId !== hit.objectID && (
                    <span>
                      <Highlight attribute="url" hit={hit} />
                    </span>
                  )}
                  {editingId === hit.objectID && <EditUrl link={hit} />}
                </div>
              </div>
              {editingId !== hit.objectID && (
                <div className="flex gap-2">
                  <button
                    className="bg-indigo-700 rounded-md p-1"
                    onClick={() => setEditingId(hit.objectID)}
                  >
                    Edit destination
                  </button>
                  <button
                    className="bg-red-700 rounded-md p-1"
                    disabled={deleteLoading}
                    onClick={() => {
                      toast.promise(
                        deleteAsync({
                          slug: hit.slug,
                        }),
                        {
                          loading: `Deleting /${hit.slug}...`,
                          error: `Failed to delete /${hit.slug}`,
                          success: `Deleted /${hit.slug}`,
                        }
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },
    [EditUrl, deleteAsync, deleteLoading, editingId]
  );

  return (
    <>
      <NextSeo
        title="Manage links"
        description="Manage your shortened links."
      />

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
            <div>
              {isLoadingSearchApiKey && <div>Loading search...</div>}
              {!isLoadingSearchApiKey && searchApiKey && searchClient && (
                <InstantSearch
                  searchClient={searchClient}
                  indexName={searchApiKey.indexName}
                >
                  <SearchBox
                    classNames={{
                      input: "w-full bg-neutral-700 rounded-md",
                      submit: "hidden",
                      reset: "hidden",
                    }}
                    placeholder="Search by URL or slug"
                  />
                  <InfiniteHits
                    hitComponent={Hit}
                    classNames={{
                      root: "my-4",
                      list: "flex flex-col gap-8 my-4",
                      loadPrevious:
                        "bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-600 p-2 rounded-md",
                      loadMore:
                        "bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-600 p-2 rounded-md",
                    }}
                  />
                </InstantSearch>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default List;
