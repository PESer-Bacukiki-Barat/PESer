import { z } from "zod"

export const dispatchItemSchema = z.object({
  id: z.string().optional(),
  jenisSampahId: z.string().trim().min(1, "jenisSampah wajib"),
  beratTarget: z.coerce.number().min(0.01, "beratTarget harus > 0"),
  hargaJualPerKg: z.coerce.number().min(0, "hargaJualPerKg wajib"),
})

export const dispatchSchema = z.object({
  kodeDispatch: z.string().trim().min(1, "kodeDispatch wajib"),
  bankSampahId: z.string().trim().min(1, "bankSampahId wajib"),
  pembeliId: z.string().trim().min(1, "pembeliId wajib"),
  tanggalJemput: z.coerce.date({ message: "tanggalJemput wajib" }),
  totalNilai: z.coerce.number().optional().nullable(),
  alasanTolak: z.string().optional().nullable(),
  alasanSelisih: z.string().optional().nullable(),
  selisihSignifikan: z.boolean().default(false),
  items: z.array(dispatchItemSchema).min(1, "setidaknya 1 item"),
})

export type DispatchSchema = z.infer<typeof dispatchSchema>
export type DispatchItemSchema = z.infer<typeof dispatchItemSchema>
