# API User

Base URL: `/api/user`

Semua response JSON. `deletedAt` bukan `null` berarti sudah soft-delete (disembunyikan dari list/detail). Endpoint ini **terintegrasi langsung dengan tabel `credential`** (login email + password via NextAuth/Credentials):

- **POST** → hash password (`bcrypt`), simpan row `User` + `Credential` (`passwordHash`) dalam satu transaksi atomik.
- **PUT** → kalau `email`/`password` diubah, update juga `Credential` (password di-hash ulang).
- **DELETE** → soft-delete lokal (`deletedAt`) pada `User` + `Credential` supaya tidak bisa login.
- **GET** → read-only, tidak menyentuh kredensial.

`bankSampahId` wajib kalau `role = PETUGAS` (BR-02).

## List — `GET /api/user`

```bash
curl http://localhost:3000/api/user
```

```json
[
  { "id": "c_u1", "email": "a@b.co", "nama": "Budi", "role": "PETUGAS", "bankSampahId": "c_bs1", "isActive": true, "bankSampah": { "id": "c_bs1", "nama": "Bank Sukamaju" }, "createdAt": "...", "updatedAt": "...", "deletedAt": null }
]
```

## Create — `POST /api/user`

```bash
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"email": "a@b.co", "password": "rahasia123", "nama": "Budi", "role": "PETUGAS", "bankSampahId": "c_bs1"}'
```

- `201` sukses, `400` validasi gagal / `bankSampahId` kosong padahal PETUGAS / password < 6, `409` kalau email sudah dipakai.

## Detail — `GET /api/user/[id]`

```bash
curl http://localhost:3000/api/user/c_u1
```

- `404` kalau tidak ditemukan / sudah soft-delete.

## Update — `PUT /api/user/[id]`

```bash
curl -X PUT http://localhost:3000/api/user/c_u1 \
  -H "Content-Type: application/json" \
  -d '{"email": "budi@b.co", "password": "baru12345", "role": "ADMIN", "bankSampahId": null}'
```

- `400` validasi gagal, `404` kalau tidak ditemukan, `409` kalau email sudah dipakai user lain.

## Delete (soft) — `DELETE /api/user/[id]`

```bash
curl -X DELETE http://localhost:3000/api/user/c_u1
```

- `204` sukses (no content), `404` kalau tidak ditemukan.