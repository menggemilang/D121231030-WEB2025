// --- KONFIGURASI & STATE ---
const STORAGE_KEY = "crud_mahasiswa";
let dataMahasiswa = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let sortState = { column: "", direction: "asc" };

// --- ELEMEN HTML ---
const form = document.getElementById("form-mahasiswa");
const elId = document.getElementById("id");
const elNama = document.getElementById("nama");
const elNim = document.getElementById("nim");
const elNoHp = document.getElementById("no_hp");
const elProgramStudi = document.getElementById("program_studi");
const tbody = document.getElementById("tbody");
const elSearch = document.getElementById("search");
const tableHeader = document.querySelector("thead tr");
const elExcelFile = document.getElementById("excel_file");
const btnImport = document.getElementById("btn-import");
const btnExport = document.getElementById("btn-export");

// --- FUNGSI-FUNGSI UTAMA ---

/**
 * Fungsi utama untuk menampilkan data ke tabel.
 * Juga menangani pembaruan indikator sort dan filter.
 */
function render() {
  // 1. Terapkan filter pencarian
  const searchTerm = elSearch.value.toLowerCase();
  let dataToDisplay = dataMahasiswa.filter(mhs => 
    mhs.nama.toLowerCase().includes(searchTerm) || 
    mhs.nim.toLowerCase().includes(searchTerm) ||
    (mhs.no_hp && mhs.no_hp.includes(searchTerm)) ||
    mhs.program_studi.toLowerCase().includes(searchTerm)
  );

  // 2. Terapkan pengurutan (sorting)
  if (sortState.column) {
    dataToDisplay.sort((a, b) => {
      const valA = a[sortState.column].toString().toLowerCase();
      const valB = b[sortState.column].toString().toLowerCase();
      const direction = sortState.direction === "asc" ? 1 : -1;
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }

  // 3. Update indikator panah di header tabel
  tableHeader.querySelectorAll("th[data-sort]").forEach(th => {
    const col = th.dataset.sort;
    const name = col.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
    if (col === sortState.column) {
      th.textContent = `${name} ${sortState.direction === "asc" ? "↑" : "↓"}`;
    } else {
      th.textContent = `${name} ↕`;
    }
  });

  // 4. Render baris tabel menggunakan map().join() agar lebih ringkas
  tbody.innerHTML = dataToDisplay.length > 0 
    ? dataToDisplay.map((row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${row.nama}</td>
          <td>${row.nim}</td>
          <td>${row.no_hp || ''}</td>
          <td>${row.program_studi}</td>
          <td class="kolom-aksi">
            <button type="button" class="btn-icon" data-action="edit" data-id="${row.id}" title="Edit">✏️</button>
            <button type="button" class="btn-icon" data-action="delete" data-id="${row.id}" title="Hapus">🗑️</button>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="6" style="text-align: center;">Data tidak ditemukan</td></tr>`;
}

/**
 * Menyimpan data ke localStorage dan me-render ulang tabel.
 */
function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMahasiswa));
  render();
}

// --- EVENT HANDLERS (Penanganan Aksi Pengguna) ---

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = elId.value;
  const nama = elNama.value.trim();
  const nim = elNim.value.trim();
  const noHp = elNoHp.value.trim();
  const programStudi = elProgramStudi.value;

  if (!nama || !nim || !programStudi || !noHp) {
    return alert("Semua field wajib diisi!");
  }

  if (!/^\d+$/.test(noHp)) {
    return alert("Nomor HP hanya boleh berisi angka.");
  }

  if (id) { // Mode Edit
    const index = dataMahasiswa.findIndex(mhs => mhs.id == id);
    if (index > -1) {
      dataMahasiswa[index] = { ...dataMahasiswa[index], nama, nim, no_hp: noHp, program_studi: programStudi };
    }
  } else { // Mode Tambah
    const newId = dataMahasiswa.length > 0 ? Math.max(...dataMahasiswa.map(mhs => mhs.id)) + 1 : 1;
    dataMahasiswa.push({ id: newId, nama, nim, no_hp: noHp, program_studi: programStudi });
  }

  form.reset();
  elId.value = '';
  elNama.focus();
  saveAndRender();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  form.reset();
  elId.value = '';
  elNama.focus();
});

elSearch.addEventListener("input", render);

tableHeader.addEventListener("click", (e) => {
  const column = e.target.dataset.sort;
  if (!column) return;

  if (sortState.column === column) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.column = column;
    sortState.direction = "asc";
  }
  render();
});

tbody.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  if (!action || !id) return;

  if (action === "edit") {
    const mhs = dataMahasiswa.find(m => m.id == id);
    if (mhs) {
      elId.value = mhs.id;
      elNama.value = mhs.nama;
      elNim.value = mhs.nim;
      elNoHp.value = mhs.no_hp || '';
      elProgramStudi.value = mhs.program_studi;
      elNama.focus();
    }
  }

  if (action === "delete") {
    if (confirm(`Yakin ingin menghapus data ini?`)) {
      dataMahasiswa = dataMahasiswa.filter(m => m.id != id);
      saveAndRender();
    }
  }
});

// --- FUNGSI IMPORT EXCEL ---

/**
 * Menangani proses import data dari file Excel.
 */
function handleImport() {
  const file = elExcelFile.files[0];
  if (!file) {
    alert("Silakan pilih file Excel terlebih dahulu.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Mengubah sheet menjadi array of arrays, mengabaikan header
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

      let lastId = dataMahasiswa.length > 0 ? Math.max(...dataMahasiswa.map(mhs => mhs.id)) : 0;

      const newData = jsonData.map((row, index) => {
        // Pastikan baris memiliki data yang cukup
        if (row.length < 4 || !row[0] || !row[1] || !row[2] || !row[3]) return null;
        return {
          id: ++lastId,
          nama: row[0],
          nim: String(row[1]),
          no_hp: String(row[2]),
          program_studi: row[3]
        };
      }).filter(Boolean); // Menghapus baris null/invalid

      dataMahasiswa.push(...newData);
      saveAndRender();
      alert(`${newData.length} data berhasil diimpor!`);
    } catch (error) {
      console.error("Error saat memproses file Excel:", error);
      alert("Terjadi kesalahan saat memproses file. Pastikan format file dan kolom sudah benar.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// --- FUNGSI EXPORT EXCEL ---

/**
 * Menangani proses ekspor data yang ditampilkan di tabel ke file Excel.
 */
function handleExport() {
  // 1. Ambil data yang sedang ditampilkan (sudah difilter dan diurutkan)
  const searchTerm = elSearch.value.toLowerCase();
  let dataToExport = dataMahasiswa.filter(mhs => 
    mhs.nama.toLowerCase().includes(searchTerm) || 
    mhs.nim.toLowerCase().includes(searchTerm) ||
    (mhs.no_hp && mhs.no_hp.includes(searchTerm)) ||
    mhs.program_studi.toLowerCase().includes(searchTerm)
  );

  if (sortState.column) {
    dataToExport.sort((a, b) => {
      const valA = a[sortState.column].toString().toLowerCase();
      const valB = b[sortState.column].toString().toLowerCase();
      const direction = sortState.direction === "asc" ? 1 : -1;
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }

  if (dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  // 2. Siapkan data untuk worksheet (array dari array)
  const header = ["#", "Nama", "NIM", "No. HP", "Program Studi"];
  const dataForSheet = dataToExport.map((row, idx) => [
    idx + 1,
    row.nama,
    row.nim,
    row.no_hp || '',
    row.program_studi
  ]);

  // 3. Buat worksheet dan workbook
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataForSheet]);
  
  // Atur lebar kolom agar lebih rapi
  worksheet['!cols'] = [ { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 25 } ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Mahasiswa");

  // 4. Hasilkan file dan picu unduhan
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Data_Mahasiswa_${today}.xlsx`);
}

btnImport.addEventListener("click", handleImport);
btnExport.addEventListener("click", handleExport);

// --- INISIALISASI ---
// Panggil render() saat halaman pertama kali dimuat.
render();
