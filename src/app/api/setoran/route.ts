import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const data = await prisma.setoran.findMany({
    include: {
      bankSampah: true,
      nasabah: true,
      petugas: true,
      items: { include: { jenisSampah: true } },
    },
    orderBy: { tanggal: "desc" },
  });

  return Response.json(data);
}
