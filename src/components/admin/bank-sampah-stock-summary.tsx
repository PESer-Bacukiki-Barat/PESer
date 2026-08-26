// Ringkasan stock se-kecamatan. Sumber data: model Stock di Prisma,
// di-query oleh Server Component halaman Bank Sampah lalu diteruskan
// sebagai props (Decimal sudah dikonversi ke number).

export type StockItem = {
  jenisSampahId: string;
  jenisSampah: string;
  berat: number;
  beratReservasi: number;
};

export type BankSampahStock = {
  id: string;
  isActive: boolean;
  stock: StockItem[];
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function stockTotalBerat(stock: StockItem[]): number {
  return stock.reduce((sum, s) => sum + s.berat, 0);
}

// Tersedia = berat - beratReservasi (yang sudah ditahan oleh dispatch berjalan).
function stockTotalTersedia(stock: StockItem[]): number {
  return stock.reduce((sum, s) => sum + s.berat - s.beratReservasi, 0);
}

type SummaryCardProps = {
  label: string;
  value: string;
  sub?: string;
};

function SummaryCard({ label, value, sub }: SummaryCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">{label}</p>
      <p className="text-headline-md font-mono text-on-surface font-semibold">
        {value}
      </p>
      {sub && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{sub}</p>
      )}
    </div>
  );
}

export function BankSampahStockSummary({
  bankSampah,
}: {
  bankSampah: BankSampahStock[];
}) {
  const total = bankSampah.reduce((sum, b) => sum + stockTotalBerat(b.stock), 0);
  const tersedia = bankSampah.reduce((sum, b) => sum + stockTotalTersedia(b.stock), 0);
  const reservasi = total - tersedia;
  const banksWithStock = bankSampah.filter(
    (b) => b.isActive && stockTotalBerat(b.stock) > 0,
  ).length;

  const perJenis = new Map<string, { nama: string; berat: number }>();
  for (const b of bankSampah) {
    for (const item of b.stock) {
      const cur = perJenis.get(item.jenisSampahId) ?? { nama: item.jenisSampah, berat: 0 };
      cur.berat += item.berat;
      perJenis.set(item.jenisSampahId, cur);
    }
  }

  const jenisList = Array.from(perJenis.values()).sort((a, b) => b.berat - a.berat);

  return (
    <section
      aria-label="Total stock se-kecamatan"
      className="mt-8 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <SummaryCard label="Total Stock" value={`${formatNumber(total)} kg`} />
      <SummaryCard
        label="Tersedia"
        value={`${formatNumber(tersedia)} kg`}
        sub={reservasi > 0 ? `${formatNumber(reservasi)} kg ditahan (dispatch)` : undefined}
      />
      <SummaryCard
        label="Bank Sampah Aktif dengan Stock"
        value={String(banksWithStock)}
        sub={`${bankSampah.length} unit terdaftar`}
      />
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
          Perincangan per Jenis
        </p>
        {jenisList.length === 0 ? (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Belum ada stock.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {jenisList.map((j) => (
              <li
                key={j.nama}
                className="flex items-center justify-between"
              >
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[140px]">
                  {j.nama}
                </span>
                <span className="font-label-md text-label-md font-mono text-on-surface">
                  {formatNumber(j.berat)} kg
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
