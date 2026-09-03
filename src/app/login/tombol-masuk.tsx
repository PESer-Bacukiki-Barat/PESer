"use client"

import { useFormStatus } from "react-dom"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Tombol submit login dengan keadaan menunggu.
 *
 * Sebelumnya tombolnya tidak punya umpan balik sama sekali: di sinyal lemah
 * petugas menekannya berkali-kali karena layarnya diam, dan setiap tekanan
 * mengirim satu percobaan login lagi.
 *
 * `useFormStatus` membaca status form induknya, jadi Server Action di
 * `actions/auth.ts` tidak perlu diubah menjadi client-side state. Itu sebabnya
 * komponen ini terpisah — hook-nya hanya bekerja di dalam <form>, di komponen
 * yang berbeda dari yang merender form itu.
 */
export function TombolMasuk() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="h-11 w-full">
      <LogIn className="size-4" aria-hidden />
      {pending ? "Memeriksa…" : "Masuk"}
    </Button>
  )
}
