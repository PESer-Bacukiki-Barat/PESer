import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/auth"
import KelurahanClient from "./kelurahan-client"

export default async function KelurahanPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")
  return <KelurahanClient />
}
