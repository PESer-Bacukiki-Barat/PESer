import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const data = await prisma.setoran.findUnique({
    where: { id },
    include: {
      bankSampah: true,
      nasabah: true,
      petugas: true,
      items: { include: { jenisSampah: true } },
    },
  });

  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 });
  return Response.json(data);
}
