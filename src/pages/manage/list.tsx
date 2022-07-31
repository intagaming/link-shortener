import { NextPage } from "next";
import Link from "next/link";

const List: NextPage = () => {
  return (
    <div className="flex-1 flex justify-center items-center">
      <div className="w-[66vw] max-w-lg flex flex-col gap-5">
        <Link href="/">
          <a className="bg-indigo-700 p-2 rounded-md text-center">
            Back to home
          </a>
        </Link>
        <h1 className="text-3xl font-bold">Your links</h1>
      </div>
    </div>
  );
};

export default List;
