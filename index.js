/**
 * Main Application - CLI Interface
 * File ini adalah entry point aplikasi
 *
 * TODO: Implementasikan CLI interface yang interaktif dengan menu:
 * 1. Tambah Siswa Baru
 * 2. Lihat Semua Siswa
 * 3. Cari Siswa (by ID)
 * 4. Update Data Siswa
 * 5. Hapus Siswa
 * 6. Tambah Nilai Siswa
 * 7. Lihat Top 3 Siswa
 * 8. Keluar
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline-sync';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_FILE = path.join(__dirname, 'students.json');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isValidId(v) {
  return isNonEmptyString(v);
}
function isValidScore(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
}
function formatNumber(num, digits = 2) {
  return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
}

// Student class
class Student {
  _id;
  _name;
  _class;
  _grades;

  constructor({ id, name, className, grades = {} }) {
    if (!isValidId(id)) throw new Error('ID tidak valid');
    if (!isNonEmptyString(name)) throw new Error('Nama tidak boleh kosong');
    if (!isNonEmptyString(className))
      throw new Error('Kelas tidak boleh kosong');

    this._id = id;
    this._name = name.trim();
    this._class = className.trim();
    this._grades = {};

    // tambah nilai awal
    for (const [sub, sc] of Object.entries(grades)) {
      const n = Number(sc);
      if (isValidScore(n)) this._grades[sub] = n;
    }
  }

  // getters & setters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get className() {
    return this._class;
  }
  get grades() {
    return { ...this._grades };
  }

  set name(nm) {
    if (!isNonEmptyString(nm)) throw new Error('Nama tidak boleh kosong');
    this._name = nm.trim();
  }
  set className(cls) {
    if (!isNonEmptyString(cls)) throw new Error('Kelas tidak boleh kosong');
    this._class = cls.trim();
  }

  addGrade(subject, score) {
    if (!isNonEmptyString(subject))
      throw new Error('Mata pelajaran tidak boleh kosong');
    const n = Number(score);
    if (!isValidScore(n)) throw new Error('Nilai harus angka antara 0-100');
    this._grades[subject.trim()] = n;
  }

  getAverage() {
    const vals = Object.values(this._grades);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  }

  getGradeStatus() {
    const avg = this.getAverage();
    return avg >= 75 ? 'Lulus' : 'Tidak Lulus';
  }

  displayInfo() {
    console.log(`ID: ${this._id}`);
    console.log(`Nama: ${this._name}`);
    console.log(`Kelas: ${this._class}`);
    console.log('Mata Pelajaran:');
    if (Object.keys(this._grades).length === 0) {
      console.log('  - (Belum ada nilai)');
    } else {
      for (const [sub, sc] of Object.entries(this._grades)) {
        console.log(`  - ${sub}: ${sc}`);
      }
    }
    const avg = this.getAverage();
    console.log(`Rata-rata: ${formatNumber(avg)}`);
    console.log(`Status: ${this.getGradeStatus()}`);
    console.log('------------------------');
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      className: this._class,
      grades: { ...this._grades },
    };
  }

  static fromJSON(obj) {
    return new Student({
      id: obj.id,
      name: obj.name,
      className: obj.className,
      grades: obj.grades || {},
    });
  }
}

// class StudentManager
class StudentManager {
  _students;

  constructor() {
    this._students = [];
    this.loadFromFile();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const arr = JSON.parse(raw);
        this._students = arr.map((a) => Student.fromJSON(a));
      } else {
        this._students = [];
      }
    } catch (err) {
      console.error(
        'Gagal membaca file data. Memulai dengan data kosong.',
        err.message
      );
      this._students = [];
    }
  }

  saveToFile() {
    try {
      const arr = this._students.map((s) => s.toJSON());
      fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      console.error('Gagal menyimpan data:', err.message);
    }
  }

  addStudent(student) {
    if (!(student instanceof Student))
      throw new Error('Objek harus instance Student');
    if (this.findStudent(student.id)) throw new Error('ID siswa harus unik');
    this._students.push(student);
    this.saveToFile();
  }

  removeStudent(id) {
    const idx = this._students.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) throw new Error('Siswa tidak ditemukan');
    this._students.splice(idx, 1);
    this.saveToFile();
  }

  findStudent(id) {
    return this._students.find((s) => String(s.id) === String(id)) || null;
  }

  updateStudent(id, data = {}) {
    const s = this.findStudent(id);
    if (!s) throw new Error('Siswa tidak ditemukan');
    if (data.name !== undefined) s.name = data.name;
    if (data.className !== undefined) s.className = data.className;
    if (data.grades !== undefined) {
      // update nilai siswa jika ada
      for (const [sub, sc] of Object.entries(data.grades)) {
        const n = Number(sc);
        if (isValidScore(n)) s.addGrade(sub, n);
      }
    }
    this.saveToFile();
  }

  getAllStudents() {
    return [...this._students];
  }

  getTopStudents(n = 3) {
    return [...this._students]
      .sort((a, b) => b.getAverage() - a.getAverage())
      .slice(0, n);
  }

  displayAllStudents() {
    if (this._students.length === 0) {
      console.log('Belum ada data siswa.');
      return;
    }
    console.log('\n=== DAFTAR SISWA ===');
    for (const s of this._students) {
      s.displayInfo();
    }
  }

  filterByClass(className) {
    return this._students.filter((s) => s.className === className);
  }

  exportReport(filePath) {
    const lines = [];
    for (const s of this._students) {
      lines.push(`ID: ${s.id}`);
      lines.push(`Nama: ${s.name}`);
      lines.push(`Kelas: ${s.className}`);
      lines.push('Mata Pelajaran:');
      if (Object.keys(s.grades).length === 0)
        lines.push('  - (Belum ada nilai)');
      else
        for (const [sub, sc] of Object.entries(s.grades))
          lines.push(`  - ${sub}: ${sc}`);
      lines.push(`Rata-rata: ${formatNumber(s.getAverage())}`);
      lines.push(`Status: ${s.getGradeStatus()}`);
      lines.push('------------------------');
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
}

// Menu console
const manager = new StudentManager();

function pause() {
  console.log('\nTekan enter untuk kembali ke menu...');
  readline.question('');
}

function menu() {
  console.clear();
  console.log('=== SISTEM MANAJEMEN NILAI SISWA ===');
  console.log('1. Tambah Siswa Baru');
  console.log('2. Lihat Semua Siswa');
  console.log('3. Cari Siswa (by ID)');
  console.log('4. Update Data Siswa');
  console.log('5. Hapus Siswa');
  console.log('6. Tambah Nilai Siswa');
  console.log('7. Lihat Top 3 Siswa');
  console.log('8. Export Laporan ke file');
  console.log('9. Filter by Kelas');
  console.log('0. Keluar');

  const choice = readline.question('Pilih menu (0-9): ');
  return choice.trim();
}

function addStudentFlow() {
  try {
    console.log('\n== Tambah Siswa Baru ==');
    const id = readline.question('ID: ').trim();
    if (!isValidId(id)) return console.log('ID tidak valid');
    if (manager.findStudent(id)) return console.log('ID sudah terpakai');
    const name = readline.question('Nama: ').trim();
    if (!isNonEmptyString(name)) return console.log('Nama tidak boleh kosong');
    const className = readline.question('Kelas: ').trim();
    if (!isNonEmptyString(className))
      return console.log('Kelas tidak boleh kosong');

    const s = new Student({ id, name, className });

    while (true) {
      const add = readline
        .question('Tambah nilai sekarang? (y/n): ')
        .trim()
        .toLowerCase();
      if (add === 'y') {
        const subject = readline.question('  Mata pelajaran: ').trim();
        const scStr = readline.question('  Nilai (0-100): ').trim();
        const n = Number(scStr);
        try {
          s.addGrade(subject, n);
        } catch (e) {
          console.log('  Error:', e.message);
        }
      } else break;
    }

    manager.addStudent(s);
    console.log('Siswa berhasil ditambahkan.');
  } catch (err) {
    console.log('Gagal menambah siswa:', err.message);
  }
}

function viewAllFlow() {
  manager.displayAllStudents();
}

function findStudentFlow() {
  const id = readline.question('\nMasukkan ID siswa untuk mencari: ').trim();
  const s = manager.findStudent(id);
  if (!s) console.log('Siswa tidak ditemukan');
  else s.displayInfo();
}

function updateStudentFlow() {
  const id = readline.question('\nMasukkan ID siswa untuk update: ').trim();
  const s = manager.findStudent(id);
  if (!s) {
    console.log('Siswa tidak ditemukan');
    return;
  }
  console.log('Kosongkan input jika tidak ingin mengubah field');
  const newName = readline.question(`Nama (${s.name}): `);
  const newClass = readline.question(`Kelas (${s.className}): `);
  const updateData = {};
  if (isNonEmptyString(newName)) updateData.name = newName.trim();
  if (isNonEmptyString(newClass)) updateData.className = newClass.trim();

  const editGrades = readline
    .question('Ingin menambah/mengubah nilai? (y/n): ')
    .trim()
    .toLowerCase();
  if (editGrades === 'y') {
    while (true) {
      const sub = readline
        .question('  Mata pelajaran (kosong untuk selesai): ')
        .trim();
      if (!isNonEmptyString(sub)) break;
      const scStr = readline.question('  Nilai (0-100): ').trim();
      const n = Number(scStr);
      if (!updateData.grades) updateData.grades = {};
      updateData.grades[sub] = n;
    }
  }

  try {
    manager.updateStudent(id, updateData);
    console.log('Data siswa berhasil diupdate.');
  } catch (err) {
    console.log('Gagal update:', err.message);
  }
}

function deleteStudentFlow() {
  const id = readline.question('\nMasukkan ID siswa untuk dihapus: ').trim();
  try {
    manager.removeStudent(id);
    console.log('Siswa berhasil dihapus.');
  } catch (err) {
    console.log('Gagal menghapus:', err.message);
  }
}

function addGradeFlow() {
  const id = readline
    .question('\nMasukkan ID siswa untuk tambah nilai: ')
    .trim();
  const s = manager.findStudent(id);
  if (!s) {
    console.log('Siswa tidak ditemukan');
    return;
  }
  const subject = readline.question('Mata pelajaran: ').trim();
  const scStr = readline.question('Nilai (0-100): ').trim();
  const n = Number(scStr);
  try {
    s.addGrade(subject, n);
    manager.saveToFile();
    console.log('Nilai berhasil ditambahkan.');
  } catch (err) {
    console.log('Gagal menambah nilai:', err.message);
  }
}

function viewTopFlow() {
  const top = manager.getTopStudents(3);
  console.log('\n=== TOP 3 SISWA ===');
  if (top.length === 0) console.log('Belum ada data siswa');
  else top.forEach((s) => s.displayInfo());
}

function exportFlow() {
  const fp = readline
    .question('\nNama file export (mis: laporan.txt): ')
    .trim();
  if (!isNonEmptyString(fp)) {
    console.log('Nama file tidak boleh kosong');
    return;
  }
  try {
    const out = path.join(__dirname, fp);
    manager.exportReport(out);
    console.log('Laporan berhasil diexport ke', out);
  } catch (err) {
    console.log('Gagal export:', err.message);
  }
}

function filterClassFlow() {
  const cls = readline
    .question('\nMasukkan nama kelas untuk filter (mis: 10A): ')
    .trim();
  if (!isNonEmptyString(cls)) {
    console.log('Kelas tidak boleh kosong');
    return;
  }
  const arr = manager.filterByClass(cls);
  if (arr.length === 0) {
    console.log('Tidak ada siswa di kelas', cls);
    return;
  }
  console.log(`\n== Daftar siswa di kelas ${cls} ==`);
  arr.forEach((s) => s.displayInfo());
}

// Fungsi main() utama
(function main() {
  while (true) {
    const ch = menu();
    switch (ch) {
      case '1':
        addStudentFlow();
        pause();
        break;
      case '2':
        viewAllFlow();
        pause();
        break;
      case '3':
        findStudentFlow();
        pause();
        break;
      case '4':
        updateStudentFlow();
        pause();
        break;
      case '5':
        deleteStudentFlow();
        pause();
        break;
      case '6':
        addGradeFlow();
        pause();
        break;
      case '7':
        viewTopFlow();
        pause();
        break;
      case '8':
        exportFlow();
        pause();
        break;
      case '9':
        filterClassFlow();
        pause();
        break;
      case '0':
        console.log('\nSampai jumpa!');
        process.exit(0);
      default:
        console.log('Pilihan tidak valid');
        pause();
    }
  }
})();
