import { auth } from "@/auth";
import { db } from "@/db";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Lấy thông tin user từ database
  const userId = session.user?.id;
  if (!userId) redirect("/login");
  const user = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  if (!user) return <div>Không tìm thấy thông tin người dùng.</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
      <div className="flex flex-col items-center">
        <Image
          src={user.image ?? "/default-avatar.png"}
          alt="Avatar"
          width={96}
          height={96}
          className="w-24 h-24 rounded-full mb-4 object-cover border"
        />
        <h2 className="text-2xl text-black font-bold mb-2">{user.name ?? "Chưa có tên"}</h2>
        <p className="text-gray-600 mb-1">{user.email}</p>
        {user.subscribed && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
            Đã đăng ký gói premium
          </span>
        )}
      </div>
    </div>
  );
}