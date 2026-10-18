// Verifikasi override uuid hanya pada konsumen xcode; tidak menyentuh proyek native.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const xcode = require('xcode');
const dariXcode = createRequire(require.resolve('xcode'));
assert.equal(dariXcode('uuid/package.json').version, '11.1.1');
const uuid = dariXcode('uuid');
for (const metode of ['v3', 'v5']) {
  assert.throws(() => uuid[metode]('uji', uuid[metode].DNS, Buffer.alloc(15)), RangeError);
}
assert.throws(() => uuid.v6({}, Buffer.alloc(15)), RangeError);
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-xcode-security-'));
try {
  const proyek = xcode.project(path.join(folder, 'fixture.pbxproj'));
  proyek.hash = { project: { archiveVersion: 1, classes: {}, objectVersion: 56, objects: { PBXGroup: {}, PBXBuildFile: {}, PBXFileReference: {} }, rootObject: 'AAAAAAAAAAAAAAAAAAAAAAAA' } };
  const identitas = new Set();
  for (let n = 0; n < 10000; n++) {
    const id = proyek.generateUuid();
    assert.match(id, /^[A-F0-9]{24}$/);
    assert.ok(!identitas.has(id)); identitas.add(id);
  }
  const grup = proyek.addPbxGroup([], 'PemeriksaanKeamanan', 'PemeriksaanKeamanan');
  fs.writeFileSync(proyek.filepath, proyek.writeSync());
  const hasil = xcode.project(proyek.filepath).parseSync();
  assert.equal(hasil.hash.project.objects.PBXGroup[grup.uuid].name, 'PemeriksaanKeamanan');
  console.log('PASS: uuid11 CommonJS, batas buffer v3/v5/v6, 10000 ID Xcode unik, addPbxGroup dan write/parse roundtrip.');
} finally {
  const tujuan = path.resolve(folder), akar = path.resolve(os.tmpdir()) + path.sep;
  assert.ok(tujuan.startsWith(akar) && path.basename(tujuan).startsWith('bb-xcode-security-'));
  fs.rmSync(tujuan, { recursive: true }); // Hanya folder sementara yang dibuat run ini.
}
