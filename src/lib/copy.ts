export const COPY = {
  empty: {
    noTasks: {
      title: "Belum ada tugas",
      description: "Tugas yang diberikan kepada Anda akan muncul di sini.",
    },
    noMatchingTasks: {
      title: "Tidak ada tugas yang cocok",
      description: "Coba ubah filter atau kata kunci pencarian Anda.",
    },
    noActiveTasks: {
      title: "Tidak ada tugas aktif",
      description: "Semua tugas Anda sudah selesai. Kerja bagus!",
    },
    allCaughtUp: {
      title: "Anda sudah menyelesaikan semua tugas",
      description: "Tidak ada tugas aktif saat ini. Cek lagi nanti.",
    },
    noNotifications: {
      title: "Belum ada notifikasi",
      description: "Notifikasi tugas akan muncul di sini.",
    },
    noTeamMembers: {
      title: "Belum ada anggota tim",
      description: "Tambahkan anggota tim untuk memulai.",
    },
    noLocations: {
      title: "Lokasi belum tersedia",
      description: "Aktifkan berbagi lokasi untuk muncul di radar.",
    },
    noFocOnMap: {
      title: "Tidak ada anggota FOC di radar",
      description: "Belum ada anggota FOC yang membagikan lokasinya.",
    },
    noMatchingMembers: {
      title: "Tidak ada anggota yang cocok",
      description: "Coba kata kunci pencarian lain.",
    },
  },
  loading: {
    tasks: "Memuat tugas...",
    users: "Memuat anggota tim...",
    map: "Memuat peta...",
    notifications: "Memuat notifikasi...",
    team: "Memuat data tim...",
    locations: "Memuat lokasi...",
  },
  time: {
    justNow: "Baru saja",
    minutesAgo: (m: number) => `${m} menit yang lalu`,
    hoursAgo: (h: number) => `${h} jam yang lalu`,
    daysAgo: (d: number) => `${d} hari yang lalu`,
    inMinutes: (m: number) => `Dalam ${m} menit`,
    inHours: (h: number) => `Dalam ${h} jam`,
    inDays: (d: number) => `Dalam ${d} hari`,
    overdueBy: (text: string) => `Terlambat ${text}`,
    dueToday: "Jatuh tempo hari ini",
    noDeadline: "Tanpa tenggat",
  },
  filters: {
    active: "Filter aktif",
    clearAll: "Hapus semua",
    allStatus: "Semua status",
    allPriority: "Semua prioritas",
    allAssignees: "Semua penugasan",
    unassigned: "Belum ditugaskan",
  },
  tasks: {
    start: "Mulai",
    submitReview: "Kirim tinjauan",
    complete: "Selesaikan",
    skipToNext: "Lanjut ke berikutnya",
    overdue: "Terlambat",
  },
  search: {
    placeholder: "Cari tugas...",
    searching: "Mencari...",
  },
  actions: {
    retry: "Coba lagi",
    refresh: "Segarkan",
    back: "Kembali",
    cancel: "Batal",
    save: "Simpan",
  },
  trend: {
    thisWeek: "Minggu ini",
    up: "Naik",
    down: "Turun",
    flat: "Stabil",
    noData: "Belum ada data",
  },
};
