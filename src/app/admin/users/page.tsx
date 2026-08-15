import type { Metadata } from "next";
import {
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manajemen User Kelurahan",
};

type UserStatus = "active" | "pending";

type KelurahanUser = {
  initials: string;
  initialsClass: string;
  name: string;
  kecamatan: string;
  petugas: string;
  peran: string;
  telepon: string;
  email: string;
  status: UserStatus;
};

const USERS: KelurahanUser[] = [
  {
    initials: "SM",
    initialsClass: "bg-primary-container text-primary",
    name: "Kelurahan Selong",
    kecamatan: "Kebayoran Baru",
    petugas: "Budi Santoso",
    peran: "Koor. Lapangan",
    telepon: "0812-3456-7890",
    email: "budi@selong.gov",
    status: "active",
  },
  {
    initials: "MT",
    initialsClass: "bg-surface-variant text-on-surface-variant",
    name: "Kelurahan Menteng",
    kecamatan: "Tebet",
    petugas: "Siti Rahma",
    peran: "Admin Data",
    telepon: "0819-8765-4321",
    email: "siti@menteng.gov",
    status: "pending",
  },
];

const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-primary-container text-on-primary-container",
  pending: "bg-[#fef3c7] text-[#92400e]",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
};

export default function UsersPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center font-label-md text-label-md text-on-surface-variant mb-6">
        <a className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </a>
        <ChevronRight className="mx-2 size-4" />
        <span className="text-on-surface">Manajemen User Kelurahan</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-on-surface mb-2">
          Manajemen User Kelurahan
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Kelola akun kelurahan, petugas, dan status operasional. Tambahkan unit baru atau
          perbarui informasi kontak untuk memastikan koordinasi pengelolaan sampah yang lancar.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
            <input
              type="text"
              placeholder="Cari kelurahan/petugas..."
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-label-md text-label-md text-on-surface"
            />
          </div>
          <select className="border border-outline-variant rounded-lg bg-surface-container-lowest py-2 px-3 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-label-md text-label-md text-on-surface-variant">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Pending</option>
            <option value="disabled">Nonaktif</option>
          </select>
          <select className="border border-outline-variant rounded-lg bg-surface-container-lowest py-2 px-3 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-label-md text-label-md text-on-surface-variant">
            <option value="">Semua Kecamatan</option>
            <option value="kebayoran">Kebayoran</option>
            <option value="tebet">Tebet</option>
          </select>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            type="button"
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md"
          >
            <Download className="size-[18px]" />
            <span>Export Data</span>
          </button>
          <button
            type="button"
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-on-primary-fixed-variant transition-colors font-label-md text-label-md shadow-sm"
          >
            <Plus className="size-[18px]" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant accent-primary focus:ring-primary"
                    aria-label="Pilih semua"
                  />
                </th>
                <th className="p-4 font-label-md text-label-md text-on-surface-variant">
                  Info Kelurahan
                </th>
                <th className="p-4 font-label-md text-label-md text-on-surface-variant">
                  Petugas
                </th>
                <th className="p-4 font-label-md text-label-md text-on-surface-variant">
                  Kontak
                </th>
                <th className="p-4 font-label-md text-label-md text-on-surface-variant">
                  Status
                </th>
                <th className="p-4 font-label-md text-label-md text-on-surface-variant text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {USERS.map((user) => (
                <tr key={user.email} className="hover:bg-surface-container-low transition-colors group">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant accent-primary focus:ring-primary"
                      aria-label={`Pilih ${user.name}`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-headline-md text-headline-md ${user.initialsClass}`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-medium">
                          {user.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">{user.kecamatan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-label-md text-label-md text-on-surface">{user.petugas}</p>
                    <p className="text-xs text-on-surface-variant">{user.peran}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-label-md text-label-md text-on-surface">{user.telepon}</p>
                    <p className="text-xs text-on-surface-variant">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[user.status]}`}
                    >
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="View Details"
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                      >
                        <Eye className="size-5" />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                      >
                        <Pencil className="size-5" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Showing{" "}
            <span className="font-medium text-on-surface">1</span> to{" "}
            <span className="font-medium text-on-surface">10</span> of{" "}
            <span className="font-medium text-on-surface">45</span> results
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled
              className="px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 font-label-md text-label-md"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary font-label-md text-label-md"
              >
                1
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-low text-on-surface font-label-md text-label-md transition-colors"
              >
                2
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-low text-on-surface font-label-md text-label-md transition-colors"
              >
                3
              </button>
            </div>
            <button
              type="button"
              className="px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md text-label-md"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
