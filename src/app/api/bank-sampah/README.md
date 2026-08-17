# API Bank Sampah

Base URL: `/api/bank-sampah`

Semua response JSON. `deletedAt` bukan `null` berarti sudah soft-delete (disembunyikan dari list/detail). `kelurahanId` unik (1 kelurahan = 1 bank sampah, BR-01).

## List — `GET /api/bank-sampah`

```bash
curl http://localhost:3000/api/bank-sampah
```

```json
[
  { "id": "c_bs1", "nama": "Bank Sukamaju", "kelurahanId": "c_kel1", "alamat": "Jl. Mawar 1", "latitude": -6.2, "longitude": 106.8, "isActive": true, "createdAt": "...", "updatedAt": "...", "deletedAt": null }
]
```

## Create — `POST /api/bank-sampah`

```bash
curl -X POST http://localhost:3000/api/bank-sampah \
  -H "Content-Type: application/json" \
  -d '{"nama": "Bank Sukamaju", "kelurahanId": "c_kel1", "alamat": "Jl. Mawar 1", "latitude": -6.2, "longitude": 106.8}'
```

- `201` sukses, `400` validasi gagal / `kelurahanId` tidak valid, `409` kalau `kelurahanId` sudah punya bank sampah.

## Detail — `GET /api/bank-sampah/[id]`

```bash
curl http://localhost:3000/api/bank-sampah/c_bs1
```

- `404` kalau tidak ditemukan / sudah soft-delete.

## Update — `PUT /api/bank-sampah/[id]`

```bash
curl -X PUT http://localhost:3000/api/bank-sampah/c_bs1 \
  -H "Content-Type: application/json" \
  -d '{"nama": "Bank Sukamaju Baru", "kelurahanId": "c_kel1", "alamat": "Jl. Mawar 2", "latitude": -6.21, "longitude": 106.81}'
```

- `400` validasi gagal, `404` kalau tidak ditemukan, `409` kalau `kelurahanId` sudah dipakai bank sampah lain.

## Delete (soft) — `DELETE /api/bank-sampah/[id]`

```bash
curl -X DELETE http://localhost:3000/api/bank-sampah/c_bs1
```

- `204` sukses (no content), `404` kalau tidak ditemukan.
