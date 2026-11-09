/* ==========================================
   KUIS IPAS KELAS VI
   SD NEGERI 1 PEJAWARAN
   VERSI: PENILAIAN OTOMATIS
   ========================================== */

// 1. DAFTAR MURID

const daftarMurid = [
    "ADELIA FARANISA AZNI",
    "AHZA HANAN MUTAQIM",
    "AIDA NADHIF LATIFA",
    "AKRAF AHLAL BAITI",
    "ALBAR ARROSYID",
    "ALGA ADINATA SYAHPUTRA",
    "ANASTASYA PUTRI WULANDARI",
    "AULIA IZZATUN NISA",
    "CAKKA RAFFANDITYA PRATAMA",
    "FAIRUZ AUNULLOH ASSAJID",
    "FAKIH IHSANUDIN",
    "HAZAR AFIKO MAULANA",
    "JESEN WIBISANA",
    "KANAYA NADHIFA AFRIANI",
    "KHAFIZAN SA’DAN PRAMUDYA",
    "MEILA NUR SALSA BELA",
    "MEILANI ROUDHATUL WALIJAH",
    "MUHAMMAD AL HABSYIPAHLEVIE",
    "VIOLA NUR QUSNAENI"
];


// 2. ELEMEN HTML

const formIdentitas = document.getElementById("form-identitas");
const inputNama = document.getElementById("nama");
const inputAbsen = document.getElementById("absen");
const inputKelas = document.getElementById("kelas");
const inputPaket = document.getElementById("paket");

daftarMurid.forEach((nama, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = nama;
    inputNama.appendChild(option);
});

inputNama.addEventListener("change", () => {
    inputAbsen.value = inputNama.value === ""
        ? ""
        : Number(inputNama.value) + 1;
});


// 3. VARIABEL KUIS

let bankSoal = null;
let soalAktif = [];
let nomorAktif = 0;
let jawabanMurid = {};
let pilihanKiriAktif = null;
let hasilPenilaian = null;

const warnaPasangan = [
    "#16a34a",
    "#2563eb",
    "#d97706",
    "#9333ea",
    "#0891b2",
    "#db2777"
];


// 4. MEMBACA BANK SOAL

async function muatBankSoal() {
    const response = await fetch(
        "data/bank_soal_ipas_kelas6_v1.json"
    );

    if (!response.ok) {
        throw new Error("Bank soal tidak dapat dibaca.");
    }

    bankSoal = await response.json();

    if (!Array.isArray(bankSoal.questions)) {
        throw new Error("Format bank soal tidak sesuai.");
    }
}


// 5. MENGACAK SOAL

function acakSoal(daftar) {
    const hasil = [...daftar];

    for (let i = hasil.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
    }

    return hasil;
}


// 6. MEMULAI KUIS

formIdentitas.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (inputNama.value === "" || inputPaket.value === "") {
        alert("Lengkapi identitas dan pilihan paket terlebih dahulu.");
        return;
    }

    try {
        if (!bankSoal) {
            await muatBankSoal();
        }

        const nomorAbsen = Number(inputNama.value) + 1;

        const identitas = {
            nama: daftarMurid[nomorAbsen - 1],
            nomorAbsen,
            kelas: inputKelas.value,
            paket: inputPaket.value
        };

        sessionStorage.setItem(
            "identitasMurid",
            JSON.stringify(identitas)
        );

        if (identitas.paket !== "paket-1") {
            alert(
                "Paket yang dipilih belum tersedia.\n" +
                "Saat ini baru Paket 1 yang menggunakan bank soal V1."
            );
            return;
        }

        soalAktif = acakSoal(bankSoal.questions);
        nomorAktif = 0;
        jawabanMurid = {};
        pilihanKiriAktif = null;
        hasilPenilaian = null;

        hapusLapisanGaris();
        tampilkanHalamanKuis();

    } catch (error) {
        console.error(error);
        alert("Gagal memulai kuis. Periksa file bank soal JSON.");
    }
});


// 7. HALAMAN KUIS

function tampilkanHalamanKuis() {
    const identitas = JSON.parse(
        sessionStorage.getItem("identitasMurid")
    );

    const container = document.querySelector(".container");

    container.innerHTML = `
        <section class="welcome-card">

            <h2>Latihan Penilaian IPAS Kelas VI</h2>

            <p class="description">
                ${identitas.nama} |
                Absen ${identitas.nomorAbsen} |
                Kelas ${identitas.kelas}
            </p>

            <div id="area-soal"></div>
            <div id="tombol-navigasi"></div>
            <div id="navigasi-soal"></div>

        </section>
    `;

    tampilkanSoal();
}


// 8. MENAMPILKAN SOAL

function tampilkanSoal() {
    const soal = soalAktif[nomorAktif];
    const area = document.getElementById("area-soal");

    hapusLapisanGaris();

    const progress =
        ((nomorAktif + 1) / soalAktif.length) * 100;

    let html = `
        <p>
            <strong>
                Soal ${nomorAktif + 1} dari ${soalAktif.length}
            </strong>
        </p>

        <div style="
            background:#e5e7eb;
            height:8px;
            border-radius:10px;
            margin:12px 0 20px;
        ">
            <div style="
                background:#2563a6;
                width:${progress}%;
                height:8px;
                border-radius:10px;
            "></div>
        </div>

        <p style="color:#718096;font-size:13px;">
            ${soal.topic} | ${soal.difficulty.toUpperCase()}
        </p>
    `;

    if (soal.stimulus) {
        html += `
            <div style="
                background:#f1f5f9;
                padding:15px;
                border-radius:10px;
                margin:15px 0;
            ">
                ${soal.stimulus}
            </div>
        `;
    }

    html += `
        <h3 style="margin:20px 0;">
            ${soal.question}
        </h3>
    `;

    if (soal.type === "pilihan_ganda") {
        html += tampilkanPilihanGanda(soal);
    }

    if (soal.type === "benar_salah") {
        html += tampilkanBenarSalah(soal);
    }

    if (soal.type === "menjodohkan") {
        html += tampilkanMenjodohkan(soal);
    }

    if (soal.type === "pilihan_ganda_kompleks") {
        html += tampilkanPilihanKompleks(soal);
    }

    area.innerHTML = html;

    tampilkanTombolNavigasi();
    tampilkanNomorSoal();

    if (soal.type === "menjodohkan") {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                gambarGarisPasangan(soal);
            });
        });
    }
}


// 9. PILIHAN GANDA

function tampilkanPilihanGanda(soal) {
    const jawaban = jawabanMurid[soal.id];

    return soal.options.map(option => `
        <label style="
            display:flex;
            gap:10px;
            padding:13px;
            margin:9px 0;
            border:1px solid #dce4ed;
            border-radius:10px;
            cursor:pointer;
        ">
            <input
                type="radio"
                name="jawaban"
                value="${option.id}"
                ${jawaban === option.id ? "checked" : ""}
                onchange="simpanJawaban(this.value)"
            >

            <span>
                <strong>${option.id}.</strong>
                ${option.text}
            </span>
        </label>
    `).join("");
}


// 10. BENAR / SALAH

function tampilkanBenarSalah(soal) {
    const jawaban = jawabanMurid[soal.id] || {};

    return soal.statements.map(statement => `
        <div style="
            padding:14px;
            border:1px solid #dce4ed;
            border-radius:10px;
            margin:12px 0;
        ">
            <p>${statement.id}. ${statement.text}</p>

            <div style="display:flex;gap:20px;margin-top:12px;">
                <label>
                    <input
                        type="radio"
                        name="bs-${statement.id}"
                        value="true"
                        ${jawaban[statement.id] === true ? "checked" : ""}
                        onchange="simpanBenarSalah('${statement.id}',true)"
                    >
                    Benar
                </label>

                <label>
                    <input
                        type="radio"
                        name="bs-${statement.id}"
                        value="false"
                        ${jawaban[statement.id] === false ? "checked" : ""}
                        onchange="simpanBenarSalah('${statement.id}',false)"
                    >
                    Salah
                </label>
            </div>
        </div>
    `).join("");
}


// 11. MENJODOHKAN

function tampilkanMenjodohkan(soal) {
    const jawaban = jawabanMurid[soal.id] || {};

    return `
        <div style="
            background:#eff6ff;
            color:#1e40af;
            padding:12px;
            border-radius:10px;
            margin-bottom:18px;
            font-size:14px;
        ">
            <strong>Cara mengerjakan:</strong>
            Klik satu pernyataan di kiri, kemudian klik pasangan
            yang sesuai di kanan. Garis panah akan menghubungkan keduanya.
        </div>

        <div id="area-menjodohkan" style="
            position:relative;
            width:100%;
        ">

            <div id="isi-kolom-menjodohkan" style="
                display:grid;
                grid-template-columns:minmax(0,1fr) 90px minmax(0,1fr);
                gap:5px;
                align-items:stretch;
            ">

                <div>
                    <h4 style="
                        text-align:center;
                        color:#173b65;
                        margin:8px 0 15px;
                    ">
                        KOLOM KIRI
                    </h4>

                    ${soal.left.map(item => {
                        const dipilih = pilihanKiriAktif === item.id;
                        const terpasang = jawaban[item.id] !== undefined;

                        return `
                            <button
                                type="button"
                                class="kotak-kiri"
                                data-id="${item.id}"
                                onclick="pilihKolomKiri('${item.id}')"
                                style="
                                    display:block;
                                    width:100%;
                                    min-height:85px;
                                    padding:10px;
                                    margin-bottom:18px;
                                    text-align:left;
                                    border:2px solid ${
                                        dipilih ? "#2563eb" :
                                        terpasang ? "#16a34a" :
                                        "#dce4ed"
                                    };
                                    border-radius:10px;
                                    background:${
                                        dipilih ? "#dbeafe" :
                                        terpasang ? "#f0fdf4" :
                                        "#ffffff"
                                    };
                                    color:#263445;
                                    cursor:pointer;
                                "
                            >
                                <strong>${item.id}.</strong>
                                ${item.text}

                                <div style="
                                    font-size:11px;
                                    margin-top:5px;
                                    color:${terpasang ? "#15803d" : "#718096"};
                                ">
                                    ${terpasang ? "Sudah dipasangkan" : "Pilih pernyataan ini"}
                                </div>
                            </button>
                        `;
                    }).join("")}
                </div>

                <div style="
                    display:flex;
                    justify-content:center;
                    align-items:stretch;
                ">
                    <div style="
                        border-left:1px dashed #cbd5e1;
                        height:100%;
                    "></div>
                </div>

                <div>
                    <h4 style="
                        text-align:center;
                        color:#173b65;
                        margin:8px 0 15px;
                    ">
                        KOLOM KANAN
                    </h4>

                    ${soal.right.map(option => {
                        const pemilik = Object.keys(jawaban).find(
                            id => jawaban[id] === option.id
                        );

                        const sudahDipakai = pemilik !== undefined;

                        const indexWarna = soal.left.findIndex(
                            item => item.id === pemilik
                        );

                        const warna = sudahDipakai
                            ? warnaPasangan[indexWarna % warnaPasangan.length]
                            : "#dce4ed";

                        return `
                            <button
                                type="button"
                                class="kotak-kanan"
                                data-id="${option.id}"
                                onclick="pilihKolomKanan('${option.id}')"
                                style="
                                    display:block;
                                    width:100%;
                                    min-height:85px;
                                    padding:10px;
                                    margin-bottom:18px;
                                    text-align:left;
                                    border:2px solid ${warna};
                                    border-radius:10px;
                                    background:${sudahDipakai ? "#f0fdf4" : "#ffffff"};
                                    color:#263445;
                                    cursor:pointer;
                                "
                            >
                                <strong>${option.id}.</strong>
                                ${option.text}

                                <div style="
                                    font-size:11px;
                                    margin-top:5px;
                                    color:${sudahDipakai ? "#15803d" : "#718096"};
                                ">
                                    ${sudahDipakai ? "Sudah terhubung" : "Pilih pasangan"}
                                </div>
                            </button>
                        `;
                    }).join("")}
                </div>

            </div>
        </div>

        <div style="
            margin-top:12px;
            padding:12px;
            background:#f8fafc;
            border-radius:8px;
            font-size:13px;
        ">
            <strong>Pasangan terisi:</strong>
            ${Object.keys(jawaban).filter(id => jawaban[id]).length}
            dari ${soal.left.length}
        </div>

        <button
            type="button"
            onclick="batalkanPilihanKiri()"
            style="
                padding:9px 14px;
                margin-top:10px;
                border:1px solid #cbd5e1;
                border-radius:8px;
                background:white;
                cursor:pointer;
            "
        >
            BATALKAN PILIHAN
        </button>
    `;
}


// 12. LAPISAN SVG

function hapusLapisanGaris() {
    const svgLama = document.getElementById("lapisan-garis-global");

    if (svgLama) {
        svgLama.remove();
    }
}


function buatLapisanGaris() {
    hapusLapisanGaris();

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.id = "lapisan-garis-global";
    svg.style.position = "fixed";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100vw";
    svg.style.height = "100vh";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "99999";

    svg.setAttribute(
        "viewBox",
        `0 0 ${window.innerWidth} ${window.innerHeight}`
    );

    document.body.appendChild(svg);

    return svg;
}


// 13. MENGGAMBAR GARIS PANAH

function gambarGarisPasangan(soal) {
    const svg = buatLapisanGaris();
    const jawaban = jawabanMurid[soal.id] || {};

    Object.entries(jawaban).forEach(([idKiri, idKanan]) => {
        if (!idKanan) return;

        const kiri = document.querySelector(
            `#area-menjodohkan .kotak-kiri[data-id="${idKiri}"]`
        );

        const kanan = document.querySelector(
            `#area-menjodohkan .kotak-kanan[data-id="${idKanan}"]`
        );

        if (!kiri || !kanan) return;

        const rectKiri = kiri.getBoundingClientRect();
        const rectKanan = kanan.getBoundingClientRect();

        const x1 = rectKiri.right;
        const y1 = rectKiri.top + rectKiri.height / 2;

        const x2 = rectKanan.left;
        const y2 = rectKanan.top + rectKanan.height / 2;

        const indexWarna = soal.left.findIndex(
            item => item.id === idKiri
        );

        const warna = warnaPasangan[
            indexWarna % warnaPasangan.length
        ];

        const defs = svg.querySelector("defs") ||
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "defs"
            );

        if (!defs.parentNode) {
            svg.appendChild(defs);
        }

        const marker = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "marker"
        );

        const markerId = `panah-${soal.id}-${idKiri}`;

        marker.setAttribute("id", markerId);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "10");
        marker.setAttribute("refX", "8");
        marker.setAttribute("refY", "4");
        marker.setAttribute("orient", "auto");

        const kepala = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        kepala.setAttribute("d", "M0,0 L0,8 L8,4 Z");
        kepala.setAttribute("fill", warna);

        marker.appendChild(kepala);
        defs.appendChild(marker);

        const jarak = Math.max(25, (x2 - x1) * 0.45);

        const garis = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        garis.setAttribute(
            "d",
            `M ${x1} ${y1} C ${x1 + jarak} ${y1}, ${x2 - jarak} ${y2}, ${x2} ${y2}`
        );

        garis.setAttribute("stroke", warna);
        garis.setAttribute("stroke-width", "3");
        garis.setAttribute("fill", "none");
        garis.setAttribute("stroke-linecap", "round");
        garis.setAttribute("marker-end", `url(#${markerId})`);

        svg.appendChild(garis);

        const titik = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        titik.setAttribute("cx", x1);
        titik.setAttribute("cy", y1);
        titik.setAttribute("r", "4");
        titik.setAttribute("fill", warna);

        svg.appendChild(titik);
    });
}


// 14. MEMILIH KOLOM KIRI

function pilihKolomKiri(id) {
    pilihanKiriAktif = id;
    tampilkanSoal();
}


// 15. MEMILIH KOLOM KANAN

function pilihKolomKanan(idKanan) {
    if (pilihanKiriAktif === null) {
        alert("Pilih terlebih dahulu pernyataan di kolom kiri.");
        return;
    }

    const soal = soalAktif[nomorAktif];

    if (!jawabanMurid[soal.id]) {
        jawabanMurid[soal.id] = {};
    }

    const jawaban = jawabanMurid[soal.id];

    const sudahDipakai = Object.entries(jawaban).some(
        ([idKiri, nilaiKanan]) =>
            idKiri !== pilihanKiriAktif &&
            nilaiKanan === idKanan
    );

    if (sudahDipakai) {
        alert("Jawaban tersebut sudah digunakan.");
        return;
    }

    jawaban[pilihanKiriAktif] = idKanan;
    pilihanKiriAktif = null;

    tampilkanSoal();
}


// 16. MEMBATALKAN PASANGAN

function batalkanPilihanKiri() {
    const soal = soalAktif[nomorAktif];

    if (!soal || soal.type !== "menjodohkan") return;

    const jawaban = jawabanMurid[soal.id] || {};

    if (pilihanKiriAktif !== null) {
        delete jawaban[pilihanKiriAktif];
        pilihanKiriAktif = null;
    } else {
        const daftarPasangan = Object.keys(jawaban);

        if (daftarPasangan.length === 0) {
            alert("Belum ada pasangan yang dapat dibatalkan.");
            return;
        }

        const pasanganTerakhir =
            daftarPasangan[daftarPasangan.length - 1];

        delete jawaban[pasanganTerakhir];
    }

    jawabanMurid[soal.id] = jawaban;
    tampilkanSoal();
}


// 17. PILIHAN GANDA KOMPLEKS

function tampilkanPilihanKompleks(soal) {
    const jawaban = jawabanMurid[soal.id] || [];

    return `
        <p style="color:#2563a6;margin-bottom:12px;">
            Pilih tepat 3 jawaban.
            Terpilih:
            <span id="jumlah-pilihan">${jawaban.length}</span>/3
        </p>

        ${soal.options.map(option => `
            <label style="
                display:flex;
                gap:10px;
                padding:13px;
                margin:9px 0;
                border:1px solid #dce4ed;
                border-radius:10px;
                cursor:pointer;
            ">
                <input
                    type="checkbox"
                    value="${option.id}"
                    ${jawaban.includes(option.id) ? "checked" : ""}
                    onchange="ubahPilihanKompleks(this)"
                >

                <span>
                    <strong>${option.id}.</strong>
                    ${option.text}
                </span>
            </label>
        `).join("")}
    `;
}


// 18. MENYIMPAN JAWABAN

function simpanJawaban(nilai) {
    const soal = soalAktif[nomorAktif];
    jawabanMurid[soal.id] = nilai;
    tampilkanNomorSoal();
}


function simpanBenarSalah(id, nilai) {
    const soal = soalAktif[nomorAktif];

    if (!jawabanMurid[soal.id]) {
        jawabanMurid[soal.id] = {};
    }

    jawabanMurid[soal.id][id] = nilai;
    tampilkanNomorSoal();
}


function ubahPilihanKompleks(checkbox) {
    const soal = soalAktif[nomorAktif];

    let jawaban = jawabanMurid[soal.id] || [];

    if (checkbox.checked) {
        if (jawaban.length >= 3) {
            checkbox.checked = false;
            alert("Maksimal hanya boleh memilih 3 jawaban.");
            return;
        }

        jawaban.push(checkbox.value);
    } else {
        jawaban = jawaban.filter(
            nilai => nilai !== checkbox.value
        );
    }

    jawabanMurid[soal.id] = jawaban;

    document.getElementById("jumlah-pilihan").textContent =
        jawaban.length;

    tampilkanNomorSoal();
}


// 19. MEMERIKSA KELENGKAPAN JAWABAN

function soalSudahDijawab(soal) {
    const jawaban = jawabanMurid[soal.id];

    if (soal.type === "pilihan_ganda") {
        return typeof jawaban === "string";
    }

    if (soal.type === "benar_salah") {
        return !!jawaban &&
            soal.statements.every(
                item => typeof jawaban[item.id] === "boolean"
            );
    }

    if (soal.type === "menjodohkan") {
        return !!jawaban &&
            soal.left.every(
                item => typeof jawaban[item.id] === "string" &&
                    jawaban[item.id] !== ""
            );
    }

    if (soal.type === "pilihan_ganda_kompleks") {
        return Array.isArray(jawaban) && jawaban.length === 3;
    }

    return false;
}


function hitungSoalBelumDijawab() {
    return soalAktif.filter(
        soal => !soalSudahDijawab(soal)
    );
}


// 20. PENILAIAN OTOMATIS

function nilaiJawaban(soal) {
    const jawaban = jawabanMurid[soal.id];
    let nilai = 0;
    let rincian = [];

    if (soal.type === "pilihan_ganda") {
        const benar = Array.isArray(soal.answer)
            ? soal.answer.includes(jawaban)
            : jawaban === soal.answer;

        nilai = benar ? 2 : 0;

        rincian.push({
            benar,
            jawabanMurid: jawaban || "Belum dijawab",
            kunci: Array.isArray(soal.answer)
                ? soal.answer.join(", ")
                : soal.answer,
            poin: nilai
        });
    }

    if (soal.type === "benar_salah") {
        const jawabanBenar = soal.statements.filter(
            item => jawaban && jawaban[item.id] === item.answer
        );

        nilai = jawabanBenar.length * 2;

        rincian = soal.statements.map(item => ({
            teks: item.text,
            benar: !!jawaban &&
                jawaban[item.id] === item.answer,
            jawabanMurid: jawaban && typeof jawaban[item.id] === "boolean"
                ? jawaban[item.id] ? "Benar" : "Salah"
                : "Belum dijawab",
            kunci: item.answer ? "Benar" : "Salah",
            poin: jawaban && jawaban[item.id] === item.answer ? 2 : 0
        }));
    }

    if (soal.type === "menjodohkan") {
        const jumlahBenar = soal.left.filter(
            item => jawaban && jawaban[item.id] === soal.answer[item.id]
        ).length;

        nilai = jumlahBenar;

        rincian = soal.left.map(item => {
            const idJawaban = jawaban ? jawaban[item.id] : undefined;
            const benar = idJawaban === soal.answer[item.id];

            const teksJawaban = soal.right.find(
                option => option.id === idJawaban
            );

            const teksKunci = soal.right.find(
                option => option.id === soal.answer[item.id]
            );

            return {
                teks: item.text,
                benar,
                jawabanMurid: teksJawaban
                    ? `${teksJawaban.id}. ${teksJawaban.text}`
                    : "Belum dijawab",
                kunci: teksKunci
                    ? `${teksKunci.id}. ${teksKunci.text}`
                    : soal.answer[item.id],
                poin: benar ? 1 : 0
            };
        });
    }

    if (soal.type === "pilihan_ganda_kompleks") {
        const daftarJawaban = Array.isArray(jawaban) ? jawaban : [];

        const jumlahBenar = daftarJawaban.filter(
            id => soal.answer.includes(id)
        ).length;

        nilai = jumlahBenar * 2;

        rincian = [{
            benar: jumlahBenar === 3,
            jawabanMurid: daftarJawaban.join(", ") || "Belum dijawab",
            kunci: soal.answer.join(", "),
            poin: nilai
        }];
    }

    return {
        nilai,
        maksimal: soal.score_max,
        rincian
    };
}


// 21. MENGHITUNG HASIL AKHIR

function hitungHasilAkhir() {
    let totalNilai = 0;
    let totalMaksimal = 0;

    const detail = soalAktif.map(soal => {
        const hasil = nilaiJawaban(soal);

        totalNilai += hasil.nilai;
        totalMaksimal += hasil.maksimal;

        return {
            soal,
            ...hasil
        };
    });

    const nilaiAkhir = totalMaksimal > 0
        ? Math.round((totalNilai / totalMaksimal) * 100)
        : 0;

    return {
        totalNilai,
        totalMaksimal,
        nilaiAkhir,
        detail
    };
}


// 22. SELESAI KUIS

function selesaikanKuis() {
    const belumDijawab = hitungSoalBelumDijawab();

    if (belumDijawab.length > 0) {
        const daftarNomor = belumDijawab.map(
            soal => soalAktif.indexOf(soal) + 1
        );

        alert(
            "Masih ada " + belumDijawab.length +
            " soal yang belum lengkap.\n\n" +
            "Nomor soal: " + daftarNomor.join(", ") +
            "\n\nSilakan lengkapi terlebih dahulu."
        );

        nomorAktif = soalAktif.indexOf(belumDijawab[0]);
        pilihanKiriAktif = null;
        tampilkanSoal();
        return;
    }

    const konfirmasi = confirm(
        "Apakah kamu yakin ingin menyelesaikan penilaian?\n\n" +
        "Jawaban tidak dapat diubah setelah kuis selesai."
    );

    if (!konfirmasi) return;

    hasilPenilaian = hitungHasilAkhir();

    tampilkanHalamanHasil();
}


// 23. HALAMAN HASIL

function tampilkanHalamanHasil() {
    hapusLapisanGaris();

    const identitas = JSON.parse(
        sessionStorage.getItem("identitasMurid")
    );

    const hasil = hasilPenilaian;

    let predikat = "";

    if (hasil.nilaiAkhir >= 90) {
        predikat = "Sangat Baik";
    } else if (hasil.nilaiAkhir >= 80) {
        predikat = "Baik";
    } else if (hasil.nilaiAkhir >= 70) {
        predikat = "Cukup";
    } else {
        predikat = "Perlu Belajar Lagi";
    }

    const container = document.querySelector(".container");

    container.innerHTML = `
        <section class="welcome-card">

            <div style="text-align:center;">
                <p style="
                    color:#2563a6;
                    font-weight:bold;
                    letter-spacing:1px;
                ">
                    HASIL LATIHAN ASAS IPAS
                </p>

                <h2>KUISIONER SELESAI!</h2>

                <p>
                    ${identitas.nama}
                </p>

                <p style="color:#718096;">
                    Absen ${identitas.nomorAbsen} |
                    Kelas ${identitas.kelas} |
                    ${identitas.paket.replace("-", " ").toUpperCase()}
                </p>

                <div style="
                    background:#eff6ff;
                    border-radius:16px;
                    padding:25px;
                    margin:25px 0;
                ">
                    <p style="margin:0;color:#475569;">
                        NILAI AKHIR
                    </p>

                    <h1 style="
                        font-size:64px;
                        color:#173b65;
                        margin:10px 0;
                    ">
                        ${hasil.nilaiAkhir}
                    </h1>

                    <p style="
                        font-size:18px;
                        font-weight:bold;
                        color:#2563a6;
                    ">
                        ${predikat}
                    </p>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
                margin-bottom:25px;
            ">
                <div style="
                    background:#f8fafc;
                    padding:15px;
                    border-radius:10px;
                    text-align:center;
                ">
                    <p style="color:#64748b;">Skor diperoleh</p>
                    <h2>${hasil.totalNilai}</h2>
                </div>

                <div style="
                    background:#f8fafc;
                    padding:15px;
                    border-radius:10px;
                    text-align:center;
                ">
                    <p style="color:#64748b;">Skor maksimal</p>
                    <h2>${hasil.totalMaksimal}</h2>
                </div>
            </div>

            <h3>Evaluasi dan Pembahasan</h3>

            <div id="daftar-pembahasan">
                ${hasil.detail.map((item, index) =>
                    tampilkanPembahasan(item, index)
                ).join("")}
            </div>

            <button
                onclick="window.location.reload()"
                style="
                    width:100%;
                    padding:15px;
                    margin-top:25px;
                    border:0;
                    border-radius:10px;
                    background:#173b65;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                KEMBALI KE HALAMAN AWAL
            </button>

        </section>
    `;
}


// 24. PEMBAHASAN SETIAP SOAL

function tampilkanPembahasan(item, index) {
    const soal = item.soal;

    let rincianHTML = "";

    item.rincian.forEach((rincian, i) => {
        rincianHTML += `
            <div style="
                padding:10px;
                margin-top:8px;
                background:#f8fafc;
                border-radius:8px;
            ">
                ${rincian.teks
                    ? `<p><strong>${i + 1}. ${rincian.teks}</strong></p>`
                    : ""
                }

                <p style="font-size:13px;">
                    Jawaban murid:
                    <strong>${rincian.jawabanMurid}</strong>
                </p>

                <p style="font-size:13px;">
                    Kunci jawaban:
                    <strong>${rincian.kunci}</strong>
                </p>

                <p style="
                    font-size:13px;
                    color:${rincian.benar ? "#15803d" : "#dc2626"};
                    font-weight:bold;
                ">
                    ${rincian.benar ? "Benar" : "Belum tepat"}
                    | ${rincian.poin} poin
                </p>
            </div>
        `;
    });

    return `
        <div style="
            border:1px solid #dce4ed;
            border-radius:12px;
            padding:15px;
            margin:15px 0;
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
                align-items:center;
            ">
                <strong>Soal ${index + 1}</strong>

                <span style="
                    background:${item.nilai === item.maksimal ? "#dcfce7" : "#f1f5f9"};
                    padding:5px 10px;
                    border-radius:20px;
                    font-size:12px;
                ">
                    ${item.nilai}/${item.maksimal} poin
                </span>
            </div>

            <p style="margin:12px 0;">
                ${soal.question}
            </p>

            ${rincianHTML}

            <div style="
                margin-top:12px;
                padding-top:10px;
                border-top:1px solid #e2e8f0;
            ">
                <strong>Pembahasan:</strong>
                <p style="line-height:1.6;margin-top:6px;">
                    ${soal.explanation || "Pembahasan belum tersedia pada bank soal."}
                </p>
            </div>
        </div>
    `;
}


// 25. TOMBOL NAVIGASI

function tampilkanTombolNavigasi() {
    const tombol = document.getElementById("tombol-navigasi");

    const soalTerakhir = nomorAktif === soalAktif.length - 1;

    tombol.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            margin-top:25px;
            margin-bottom:20px;
        ">

            <button
                onclick="soalSebelumnya()"
                ${nomorAktif === 0 ? "disabled" : ""}
                style="
                    padding:13px 18px;
                    border:0;
                    border-radius:8px;
                    background:${nomorAktif === 0 ? "#cbd5e1" : "#173b65"};
                    color:white;
                    cursor:pointer;
                "
            >
                SEBELUMNYA
            </button>

            ${
                soalTerakhir
                ? `
                    <button
                        onclick="selesaikanKuis()"
                        style="
                            padding:13px 18px;
                            border:0;
                            border-radius:8px;
                            background:#15803d;
                            color:white;
                            font-weight:bold;
                            cursor:pointer;
                        "
                    >
                        SELESAI KUIS
                    </button>
                `
                : `
                    <button
                        onclick="soalBerikutnya()"
                        style="
                            padding:13px 18px;
                            border:0;
                            border-radius:8px;
                            background:#2563a6;
                            color:white;
                            cursor:pointer;
                        "
                    >
                        BERIKUTNYA
                    </button>
                `
            }

        </div>
    `;
}


// 26. NAVIGASI NOMOR SOAL

function tampilkanNomorSoal() {
    const navigasi = document.getElementById("navigasi-soal");

    navigasi.innerHTML = `
        <h3 style="margin:20px 0 10px;">
            Navigasi Soal
        </h3>

        <div style="
            display:grid;
            grid-template-columns:repeat(6,1fr);
            gap:7px;
        ">
            ${soalAktif.map((soal,index) => {
                const sudahDijawab = soalSudahDijawab(soal);

                return `
                    <button
                        onclick="pindahSoal(${index})"
                        style="
                            padding:10px;
                            border:1px solid #dce4ed;
                            border-radius:8px;
                            background:${
                                index === nomorAktif
                                    ? "#173b65"
                                    : sudahDijawab
                                        ? "#d1fae5"
                                        : "#ffffff"
                            };
                            color:${
                                index === nomorAktif
                                    ? "#ffffff"
                                    : "#263445"
                            };
                            cursor:pointer;
                        "
                    >
                        ${index + 1}
                    </button>
                `;
            }).join("")}
        </div>

        <p style="
            font-size:12px;
            color:#64748b;
            margin-top:10px;
        ">
            Hijau = jawaban lengkap | Biru tua = soal aktif
        </p>
    `;
}


// 27. PINDAH SOAL

function pindahSoal(index) {
    nomorAktif = index;
    pilihanKiriAktif = null;
    tampilkanSoal();
}


function soalSebelumnya() {
    if (nomorAktif > 0) {
        nomorAktif--;
        pilihanKiriAktif = null;
        tampilkanSoal();
    }
}


function soalBerikutnya() {
    if (nomorAktif < soalAktif.length - 1) {
        nomorAktif++;
        pilihanKiriAktif = null;
        tampilkanSoal();
    }
}


// 28. MEMPERBARUI GARIS SAAT LAYAR BERUBAH

function perbaruiGarisJikaPerlu() {
    const soal = soalAktif[nomorAktif];

    if (soal && soal.type === "menjodohkan") {
        gambarGarisPasangan(soal);
    } else {
        hapusLapisanGaris();
    }
}

window.addEventListener("resize", perbaruiGarisJikaPerlu);
window.addEventListener("scroll", perbaruiGarisJikaPerlu, true);