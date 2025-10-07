document.addEventListener("DOMContentLoaded", () => {
  // ------------------- PERSISTENSI DATA -------------------
  const STORAGE_KEY = "crud_mahasiswa_unhas";
  const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const saveData = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // ------------------- STATE APLIKASI -------------------
  let data = loadData();
  let autoId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
  let sortConfig = { key: null, asc: true };

  // ------------------- ELEMENT HTML -------------------
  const form = document.getElementById("form-mahasiswa");
  const elId = document.getElementById("id");
  const elNama = document.getElementById("nama");
  const elNim = document.getElementById("nim");
  const elNoHp = document.getElementById("no_hp");
  const elProdi = document.getElementById("program_studi");
  const tbody = document.getElementById("tbody");
  const btnReset = document.getElementById("btn-reset");
  const searchInput = document.getElementById("search");
  const btnExport = document.getElementById("btn-export");
  const btnExportPdf = document.getElementById("btn-export-pdf");
  const excelFileInput = document.getElementById("excel_file");
  const btnImport = document.getElementById("btn-import");

  // --- Elemen Login & Konten Utama ---
  const loginContainer = document.getElementById("login-container");
  const mainContent = document.querySelector("main");
  const footerContent = document.querySelector("footer");
  const formLogin = document.getElementById("form-login");
  const elUsername = document.getElementById("username");
  const elPassword = document.getElementById("password");
  const btnLogout = document.getElementById("btn-logout");

  // ------------------- LOGIKA LOGIN & LOGOUT -------------------
  const hardcodedUsername = "admin";
  const hardcodedPassword = "password123";

  function showMainContent() {
    loginContainer.classList.add("hidden");
    mainContent.classList.remove("hidden");
    footerContent.classList.remove("hidden");
    btnLogout.classList.remove("hidden");
  }

  function showLogin() {
    loginContainer.classList.remove("hidden");
    mainContent.classList.add("hidden");
    footerContent.classList.add("hidden");
    btnLogout.classList.add("hidden");
    sessionStorage.removeItem("isLoggedIn");
    formLogin.reset();
  }

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = elUsername.value.trim();
    const password = elPassword.value.trim();

    if (username === hardcodedUsername && password === hardcodedPassword) {
      sessionStorage.setItem("isLoggedIn", "true");
      showMainContent();
    } else {
      alert("Login Gagal! Username atau password salah.");
    }
  });

  btnLogout.addEventListener("click", showLogin);

  // Cek status login saat halaman dimuat
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    showMainContent();
  } else {
    showLogin();
  }

  // ------------------- FUNGSI RENDER TABEL -------------------
  function render(filterQuery = "") {
    if (!Array.isArray(data)) data = [];

    let filteredData = data;
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      filteredData = data.filter(item =>
        item.nama.toLowerCase().includes(query) ||
        item.nim.toLowerCase().includes(query) ||
        item.no_hp.toLowerCase().includes(query) ||
        item.program_studi.toLowerCase().includes(query)
      );
    }

    // Sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.asc ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.asc ? 1 : -1;
        return 0;
      });
    }

    tbody.innerHTML = "";
    filteredData.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${row.nama}</td>
        <td>${row.nim}</td>
        <td>${row.no_hp}</td>
        <td>${row.program_studi}</td>
        <td>
          <button type="button" class="btn-edit" data-edit="${row.id}">Edit</button>
          <button type="button" class="btn-del" data-del="${row.id}">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ------------------- FORM SUBMIT (CREATE / UPDATE) -------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const idVal = elId.value.trim();
    const newEntry = {
      nama: elNama.value.trim(),
      nim: elNim.value.trim(),
      no_hp: elNoHp.value.trim(),
      program_studi: elProdi.value,
    };

    if (!newEntry.nama || !newEntry.nim || !newEntry.program_studi) {
      return alert("Nama, NIM, dan Program Studi wajib diisi.");
    }

    if (idVal) { // UPDATE
      const idNum = Number(idVal);
      const idx = data.findIndex(x => x.id === idNum);
      if (idx > -1) {
        data[idx] = { ...data[idx], ...newEntry };
      }
    } else { // CREATE
      // Cek duplikat NIM sebelum menambah data baru
      if (data.some(item => item.nim === newEntry.nim)) {
        return alert(`Error: NIM ${newEntry.nim} sudah terdaftar.`);
      }
      newEntry.id = autoId++;
      data.push(newEntry);
    }

    saveData(data);
    render(searchInput.value);
    form.reset();
    elId.value = "";
    elNama.focus();
  });

  // ------------------- RESET FORM -------------------
  btnReset.addEventListener("click", () => {
    form.reset();
    elId.value = "";
    elNama.focus();
  });

  // ------------------- HANDLER TOMBOL EDIT / HAPUS -------------------
  tbody.addEventListener("click", (e) => {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");

    if (editId) { // EDIT
      const item = data.find(x => x.id === Number(editId));
      if (item) {
        elId.value = item.id;
        elNama.value = item.nama;
        elNim.value = item.nim;
        elNoHp.value = item.no_hp;
        elProdi.value = item.program_studi;
        elNama.focus();
        window.scrollTo(0, 0);
      }
    }

    if (delId) { // DELETE
      const idNum = Number(delId);
      if (confirm("Yakin hapus data ini?")) {
        data = data.filter(x => x.id !== idNum);
        saveData(data);
        render(searchInput.value);
      }
    }
  });

  // ------------------- PENCARIAN & SORTING -------------------
  searchInput.addEventListener("input", () => render(searchInput.value));

  document.querySelector("thead").addEventListener("click", (e) => {
    const sortKey = e.target.dataset.sort;
    if (sortKey) {
      if (sortConfig.key === sortKey) {
        sortConfig.asc = !sortConfig.asc;
      } else {
        sortConfig.key = sortKey;
        sortConfig.asc = true;
      }
      render(searchInput.value);
    }
  });

  // ------------------- EKSPOR DATA -------------------
  // Fungsi helper untuk mendapatkan data yang sudah difilter sesuai pencarian
  const getFilteredData = () => {
    const filterQuery = searchInput.value;
    if (!filterQuery) {
      return data; // Jika tidak ada pencarian, kembalikan semua data
    }
    const query = filterQuery.toLowerCase();
    return data.filter(item =>
      item.nama.toLowerCase().includes(query) ||
      item.nim.toLowerCase().includes(query) ||
      item.no_hp.toLowerCase().includes(query) ||
      item.program_studi.toLowerCase().includes(query)
    );
  };

  btnExport.addEventListener("click", () => {
    const dataToExport = getFilteredData(); // Ambil data yang sudah difilter
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mahasiswa");
    XLSX.writeFile(wb, "data_mahasiswa.xlsx");
  });

  btnExportPdf.addEventListener("click", () => {
    const dataToExport = getFilteredData(); // Ambil data yang sudah difilter
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.autoTable({
      head: [['#', 'Nama', 'NIM', 'No. HP', 'Program Studi']],
      body: dataToExport.map((item, i) => [i + 1, item.nama, item.nim, item.no_hp, item.program_studi]),
    });

    doc.save('data_mahasiswa.pdf');
  });

  // ------------------- IMPOR DATA DARI EXCEL -------------------
  btnImport.addEventListener("click", () => {
    if (!excelFileInput.files.length) {
      return alert("Silakan pilih file Excel terlebih dahulu.");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileData = event.target.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Hapus header jika ada
        const header = excelData[0].map(h => h.toString().toLowerCase());
        if (header.includes('nama') || header.includes('nim')) {
          excelData.shift();
        }

        // Buat Set dari NIM yang sudah ada untuk pengecekan duplikat yang lebih cepat
        const existingNIMs = new Set(data.map(d => d.nim));

        const newData = [];
        const duplicateNIMs = [];

        excelData.forEach(row => {
          if (row.length < 4) return; // Lewati baris yang tidak lengkap

          const nim = row[1] ? row[1].toString().trim() : '';
          
          // Cek duplikat di data yang sudah ada ATAU di data yang baru akan diimpor
          // Pencarian di 'existingNIMs' jauh lebih cepat daripada .some() pada array besar
          if (nim && !existingNIMs.has(nim)) {
            newData.push({
              id: autoId++,
              nama: row[0] ? row[0].toString().trim() : '',
              nim: nim,
              no_hp: row[2] ? row[2].toString().trim() : '',
              program_studi: row[3] ? row[3].toString().trim() : '',
            });
            existingNIMs.add(nim); // Tambahkan NIM baru ke Set agar tidak ada duplikat dalam file yang sama
          } else if (nim) { // Jika NIM ada tapi sudah duplikat
            duplicateNIMs.push(nim);
          }
        });

        if (newData.length > 0) {
          data.push(...newData);
          saveData(data);
          render(searchInput.value);
        }

        // Tampilkan alert hasil import
        let alertMessage = "";
        if (newData.length > 0) {
          alertMessage += `${newData.length} data baru berhasil diimpor.\n`;
        } else {
          alertMessage += "Tidak ada data baru yang diimpor.\n";
        }

        if (duplicateNIMs.length > 0) {
          alertMessage += `${duplicateNIMs.length} data duplikat ditemukan dan diabaikan (NIM: ${duplicateNIMs.join(', ')}).`;
        }

        alert(alertMessage);

      } catch (error) {
        console.error("Error saat memproses file Excel:", error);
        alert("Terjadi kesalahan saat membaca file. Pastikan format file benar.");
      } finally {
        excelFileInput.value = ""; // Reset input file
      }
    };

    reader.readAsBinaryString(excelFileInput.files[0]);
  });

  // ------------------- INIT -------------------
  render();
});