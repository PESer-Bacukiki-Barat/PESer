# API Kelurahan

Base URL: `/api/kelurahan`

Semua response JSON. `deletedAt` bukan `null` berarti sudah soft-delete (disembunyikan dari list/detail).

## List — `GET /api/kelurahan`

```bash
curl http://localhost:3000/api/kelurahan
```

```json
[
  { "id": "c_abc", "nama": "Sukamaju", "kodeWilayah": "32.01.01", "createdAt": "...", "updatedAt": "...", "deletedAt": null }
]
```

## Create — `POST /api/kelurahan`

```bash
curl -X POST http://localhost:3000/api/kelurahan \
  -H "Content-Type: application/json" \
  -d '{"nama": "Sukamaju", "kodeWilayah": "32.01.01"}'
```

- `201` sukses, `400` kalau `nama`/`kodeWilayah` kosong, `409` kalau `kodeWilayah` sudah dipakai.

## Detail — `GET /api/kelurahan/[id]`

```bash
curl http://localhost:3000/api/kelurahan/c_abc
```

- `404` kalau tidak ditemukan / sudah soft-delete.

## Update — `PUT /api/kelurahan/[id]`

```bash
curl -X PUT http://localhost:3000/api/kelurahan/c_abc \
  -H "Content-Type: application/json" \
  -d '{"nama": "Sukamaju Baru", "kodeWilayah": "32.01.02"}'
```

- `400` validasi gagal, `404` kalau tidak ditemukan.

## Delete (soft) — `DELETE /api/kelurahan/[id]`

```bash
curl -X DELETE http://localhost:3000/api/kelurahan/c_abc
```

- `204` sukses (no content), `404` kalau tidak ditemukan.
