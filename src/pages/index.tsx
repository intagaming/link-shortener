import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  return (
    <div className="w-full min-h-screen bg-neutral-900 text-neutral-100 flex justify-center items-center">
      <div className="bg-indigo-700 rounded-md w-[66vw]">
        <form className="flex">
          <input
            type="url"
            className="rounded-md flex-1 bg-neutral-700"
            placeholder="Enter URL to shorten"
          />

          <button type="submit" className="px-3">
            Shorten
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
