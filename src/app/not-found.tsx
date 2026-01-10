import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-52 flex flex-col items-center font-semibold">
      <h1>404 - Not Found</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link href={"/"} replace>
        Home 화면으로 이동
      </Link>
    </div>
  );
}
