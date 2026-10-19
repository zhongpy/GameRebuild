import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectCandidate, versionMatches, sdkChecks, renderReport, validateConfig, condaProcessEnv } from './check-environment.mjs';

test('Conda DLL paths apply only to the child process and preserve the existing PATH', () => {
  const original = {PATH:'original-tools',KEEP:'unchanged'};
  const root = path.resolve('test-conda');
  const child = condaProcessEnv(path.join(root,'Scripts','conda.exe'),original);
  assert.equal(original.PATH,'original-tools');
  assert.equal(child.KEEP,'unchanged');
  assert.ok(child.PATH.split(path.delimiter).includes(path.join(root,'Library/bin')));
  assert.ok(child.PATH.endsWith('original-tools'));
});

test('an invalid manual override cannot silently switch to another installation', () => {
  const selected = selectCandidate('/missing/manual/tool', [process.execPath], () => ({version:'1'}));
  assert.equal(selected.path, '/missing/manual/tool');
  assert.equal(selected.version, null);
});
test('preferred Java major is chosen even when a newer installation is first', () => {
  const selected = selectCandidate('', [process.execPath, fileURLToPath(import.meta.url)], p => ({version:p === process.execPath ? '21.0.7' : '17.0.15'}), x => versionMatches(x.version,'17'));
  assert.equal(selected.version, '17.0.15');
});
test('version matching respects component boundaries', () => {
  assert.equal(versionMatches('17.0.15','17'), true);
  assert.equal(versionMatches('170.0.1','17'), false);
  assert.equal(versionMatches(null,'17'), false);
});
test('invalid configuration cannot produce a misleading environment report', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../environment.example.json',import.meta.url),'utf8'));
  validateConfig(config);
  config.overrides.creator = 'relative/editor.exe';
  assert.throws(() => validateConfig(config),/absolute path/);
  config.overrides.creator = '';
  config.requirements.androidNdk = '../outside';
  assert.throws(() => validateConfig(config),/Invalid requirement/);
});
test('build-tools 36 does not imply platform android-36 is installed', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'game-rebuild-sdk-'));
  t.after(() => {
    const target = path.resolve(root);
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep + 'game-rebuild-sdk-'));
    fs.rmSync(target,{recursive:true,force:true});
  });
  fs.mkdirSync(path.join(root,'build-tools','36.0.0'),{recursive:true});
  fs.writeFileSync(path.join(root,'build-tools','36.0.0',process.platform === 'win32' ? 'aapt2.exe' : 'aapt2'),'fixture');
  const checks = sdkChecks(root,{androidPlatform:'android-36',androidBuildTools:'36.0.0',androidNdk:'27',cmake:'3.22.1'});
  assert.equal(checks.find(x=>x.id==='androidBuildTools').status,'found');
  assert.equal(checks.find(x=>x.id==='androidPlatform').status,'missing');
});
test('generated report preserves missing components and does not claim a successful build', () => {
  const report = renderReport({checkedAt:'2026-10-19T00:00:00Z',host:{platform:'test',arch:'test'},tools:[],androidComponents:[{id:'androidPlatform',version:'android-36',status:'missing',action:'Install SDK 36'}],readiness:{h5Prerequisites:true,wechatPrerequisites:false,androidPrerequisites:false},manualChecks:[]});
  assert.match(report,/Install SDK 36/);
  assert.match(report,/构建通过：未验证/);
});
