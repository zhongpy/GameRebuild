import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
export const pythonPrefix = path.join(workspace, '.local', 'conda', 'game-rebuild-tools');
export const pythonExecutable = path.join(pythonPrefix, win ? 'python.exe' : 'bin/python');
export function condaProcessEnv(executable, baseEnv = process.env) {
  const bin = path.dirname(executable);
  const root = /^(Scripts|bin)$/i.test(path.basename(bin)) ? path.dirname(bin) : bin;
  return { ...baseEnv, PATH: [root, path.join(root, 'Library/bin'), path.join(root, 'Scripts'), path.join(root, 'bin'), baseEnv.PATH || ''].join(path.delimiter) };
}
const exists = p => typeof p === 'string' && p.length > 0 && fs.existsSync(p);
const directories = p => { try { return fs.readdirSync(p, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => path.join(p, x.name)); } catch { return []; } };
const unique = values => [...new Set(values.filter(Boolean))];
const json = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
function run(exe, args, env = process.env) {
  try { return execFileSync(exe, args, { env, encoding: 'utf8', timeout: 12000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return ''; }
}
function powershell(script) {
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from('[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false);' + script, 'utf16le').toString('base64')]);
}
const psQuote = s => "'" + s.replaceAll("'", "''") + "'";
function onPath(names) {
  return unique((process.env.PATH || '').split(path.delimiter).flatMap(dir => names.map(n => path.join(dir.replace(/^"|"$/g, ''), n)))).filter(exists);
}
export function selectCandidate(override, candidates, inspect, accepts = () => true) {
  // An explicit invalid override must stay visible; never silently replace it.
  const list = override ? [override] : unique(candidates);
  const inspected = list.filter(exists).map(p => ({ path: path.resolve(p), ...inspect(p) }));
  const selected = inspected.find(x => accepts(x) && x.version) || inspected.find(x => accepts(x)) || inspected[0];
  return selected || { path: override || null, version: null };
}
export function versionMatches(actual, expected) {
  return !!actual && (actual === expected || actual.startsWith(expected + '.') || actual.startsWith(expected + '+'));
}
function fileVersion(p) {
  if (!exists(p)) return { version: null };
  if (!win) return { version: null };
  return { version: powershell(`(Get-Item -LiteralPath ${psQuote(p)}).VersionInfo.ProductVersion`) || null };
}
export function isWeChatDevtoolsIdentity(info) {
  if(/alipay|支付宝/i.test(info.companyName||''))return false;
  return /微信(?:web)?开发者工具|wechat.*devtools/i.test(info.productName||'');
}
function wechatVersion(p) {
  if(!win)return fileVersion(p);
  try {
    const info=JSON.parse(powershell(`(Get-Item -LiteralPath ${psQuote(p)}).VersionInfo | Select-Object ProductVersion,ProductName,CompanyName | ConvertTo-Json -Compress`));
    const result={version:info.ProductVersion||null,productName:info.ProductName,companyName:info.CompanyName};
    // The Windows launcher has its own version (e.g. 1.03.0); prefer the actual IDE package.
    const appPackage=path.join(path.dirname(p),'code/package.nw/package.json');
    if(exists(appPackage)){
      const app=json(appPackage);
      if(app.appname==='wechatwebdevtools'&&app.version){result.launcherVersion=result.version;result.version=app.version;}
    }
    return {...result,isWeChatDevtools:isWeChatDevtoolsIdentity(result),cli:path.join(path.dirname(p),'cli.js')};
  } catch {return {version:null,isWeChatDevtools:false};}
}
function creatorVersion(p) {
  const base = process.platform === 'darwin' ? path.resolve(path.dirname(p), '..') : path.dirname(p);
  const packageFile = path.join(base, 'resources', 'resources', '3d', 'engine', 'package.json');
  try { return { version: json(packageFile).version, enginePackage: packageFile }; } catch { return fileVersion(p); }
}
function javaVersion(home) {
  if (!exists(path.join(home, 'bin', win ? 'java.exe' : 'java'))) return { version: null };
  try { return { version: fs.readFileSync(path.join(home, 'release'), 'utf8').match(/^JAVA_VERSION="([^"]+)"/m)?.[1] || null }; } catch { return { version: null }; }
}
export function validateConfig(config) {
  const r = config.requirements;
  if (!r || !Number.isInteger(r.nodeMajorMin) || r.nodeMajorMin < 18 || !Number.isInteger(r.javaMajor) || r.javaMajor < 1) throw new Error('Invalid Node/Java version requirements');
  for (const key of ['creatorVersion','androidPlatform','androidBuildTools','androidNdk','cmake','pythonMin']) {
    if (typeof r[key] !== 'string' || !/^[a-zA-Z0-9.+-]+$/.test(r[key])) throw new Error('Invalid requirement: '+key);
  }
  const allowed = ['git','node','creator','wechatDevtools','androidStudio','androidSdk','javaHome','python','conda'];
  for (const [key,value] of Object.entries(config.overrides || {})) {
    if (!allowed.includes(key) || typeof value !== 'string' || (value && !path.isAbsolute(value))) throw new Error('Override must be a known tool and an absolute path: '+key);
  }
}
export function sdkChecks(sdk, requirements) {
  const specs = [
    ['androidPlatform', 'platforms', requirements.androidPlatform, 'android.jar'],
    ['androidBuildTools', 'build-tools', requirements.androidBuildTools, win ? 'aapt2.exe' : 'aapt2'],
    ['androidNdk', 'ndk', requirements.androidNdk, 'source.properties'],
    ['cmake', 'cmake', requirements.cmake, path.join('bin', win ? 'cmake.exe' : 'cmake')],
  ];
  return specs.map(([id, folder, version, marker]) => {
    const location = sdk ? path.join(sdk, folder, version) : null;
    return { id, path: location, version, status: location && exists(path.join(location, marker)) ? 'found' : 'missing', installed: sdk ? directories(path.join(sdk, folder)).map(p => path.basename(p)) : [], action: `Install/verify SDK Manager component ${folder};${version}` };
  }).concat([{ id: 'adb', path: sdk ? path.join(sdk, 'platform-tools', win ? 'adb.exe' : 'adb') : null, version: null, status: sdk && exists(path.join(sdk, 'platform-tools', win ? 'adb.exe' : 'adb')) ? 'found' : 'missing', action: 'Install Android SDK Platform-Tools' }]);
}

function discover() {
  const home = os.homedir();
  let registry = [];
  let drives = [];
  if (win) {
    try { registry = JSON.parse(powershell("@(Get-ItemProperty 'HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*','HKLM:/Software/Microsoft/Windows/CurrentVersion/Uninstall/*','HKLM:/Software/WOW6432Node/Microsoft/Windows/CurrentVersion/Uninstall/*' -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -match 'Cocos|Android Studio|微信|小程序|Miniconda|Anaconda|Miniforge'} | Select-Object DisplayName,DisplayVersion,InstallLocation,DisplayIcon,UninstallString) | ConvertTo-Json -Compress") || '[]'); } catch { /* common roots and overrides remain available */ }
    try { drives = JSON.parse(powershell('@(Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Root -match "^[A-Za-z]:"} | Select-Object -ExpandProperty Root) | ConvertTo-Json -Compress') || '[]'); } catch { drives = [path.parse(home).root]; }
  }
  const programRoots = unique([process.env.ProgramFiles, process.env['ProgramFiles(x86)'], ...drives.flatMap(d => [path.join(d, 'Program Files'), path.join(d, 'Program Files (x86)'), path.join(d, 'Apps')])]);
  const cocosRoots = unique([
    ...programRoots.flatMap(p => [path.join(p, 'CocosEditor', 'Creator'), path.join(p, 'CocosDashboard', 'resources', '.editors', 'Creator')]),
    ...registry.filter(r => /Cocos/.test(r.DisplayName) && r.InstallLocation).map(r => path.resolve(r.InstallLocation, '..', 'CocosEditor', 'Creator')),
    '/Applications/Cocos/Creator', '/Applications/CocosCreator/Creator', path.join(home, 'Cocos', 'Creator'),
  ]);
  const creator = cocosRoots.flatMap(p => directories(p).map(v => path.join(v, win ? 'CocosCreator.exe' : process.platform === 'darwin' ? 'CocosCreator.app/Contents/MacOS/CocosCreator' : 'CocosCreator')));
  const sdk = unique([process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME, path.join(home, 'AppData/Local/Android/Sdk'), path.join(home, 'Library/Android/sdk'), path.join(home, 'Android/Sdk'), ...drives.map(d => path.join(d, 'Android/Sdk'))]);
  const javaHome = unique([process.env.JAVA_HOME, ...drives.flatMap(d => directories(path.join(d, 'Android/Java'))), ...programRoots.flatMap(p => [...directories(path.join(p, 'Java')), ...directories(path.join(p, 'Microsoft')).filter(v => /jdk/i.test(v))]), ...directories('/Library/Java/JavaVirtualMachines').map(p => path.join(p, 'Contents/Home')), ...directories('/usr/lib/jvm')]);
  const wechatRegistry=registry.filter(r=>/微信.*开发者工具|wechat.*devtools/i.test(r.DisplayName||'')).map(r=>(r.DisplayIcon||'').replace(/,\d+$/,'').replace(/^"|"$/g,''));
  const wechatDevtools = unique([...wechatRegistry,...programRoots.flatMap(p => ['微信web开发者工具','Tencent/微信web开发者工具'].flatMap(folder=>['微信开发者工具.exe','微信web开发者工具.exe','wechatdevtools.exe'].map(exe=>path.join(p,folder,exe)))), '/Applications/wechatwebdevtools.app/Contents/MacOS/wechatwebdevtools']);
  const studioRegistry = registry.filter(r => /Android Studio/.test(r.DisplayName)).map(r => (r.DisplayIcon || '').replace(/^"|"$/g, '').replace(/,\d+$/, ''));
  const androidStudio = unique([...studioRegistry.flatMap(p => [p, path.join(path.dirname(p), 'studio64.exe')]), ...programRoots.flatMap(p => ['studio64.exe','studio.exe'].map(n => path.join(p, 'Android/Android Studio/bin', n))), '/Applications/Android Studio.app/Contents/MacOS/studio', '/opt/android-studio/bin/studio.sh']);
  const condaRoots = unique([
    ...[home, process.env.ProgramData, ...drives, ...programRoots].filter(Boolean).flatMap(p => ['miniconda3','anaconda3','miniforge3'].map(n => path.join(p,n))),
    ...registry.filter(r => /Miniconda|Anaconda|Miniforge/i.test(r.DisplayName)).map(r => r.InstallLocation || path.dirname((r.UninstallString || '').replace(/^"([^"]+)".*$/, '$1'))),
    '/opt/miniconda3','/opt/anaconda3',
  ]);
  const conda = unique([process.env.CONDA_EXE, ...onPath(win ? ['conda.exe'] : ['conda']), ...condaRoots.map(p => path.join(p,win ? 'Scripts/conda.exe' : 'bin/conda'))]);
  return { registry, creator, sdk, javaHome, wechatDevtools, androidStudio, conda };
}

export function findConda(override, candidates = discover().conda) {
  return selectCandidate(override, candidates || [], p => ({version: run(p,['--version'],condaProcessEnv(p)).match(/conda (\S+)/)?.[1] || null}));
}

export function inspectPython(p) {
  const prefix = win ? path.dirname(p) : path.dirname(path.dirname(p));
  const env = { ...condaProcessEnv(p), PYTHONUTF8: '1' };
  try {
    const info = JSON.parse(run(p, ['-c', 'import json,sys,yaml; print(json.dumps({"version":sys.version.split()[0],"pyyaml":yaml.__version__}))'], env));
    return { ...info, condaManaged: exists(path.join(prefix, 'conda-meta/history')) };
  } catch { return {version:null, condaManaged:exists(path.join(prefix,'conda-meta/history'))}; }
}

function checkTool(id, selected, expectation, accept, required = true) {
  let status = !exists(selected.path) ? 'missing' : !selected.version ? 'unverified' : accept(selected.version) ? 'found' : 'version-mismatch';
  return { id, ...selected, status, required, expected: expectation, action: status === 'found' ? '' : `Install/locate ${id} (${expectation}); set overrides.${id}` };
}
export function inspectEnvironment(config, candidates = discover()) {
  const r = config.requirements;
  const o = config.overrides || {};
  const cli = (args, pattern) => p => ({ version: run(p, args).match(pattern)?.[1] || null });
  const tools = [
    checkTool('conda', findConda(o.conda, candidates.conda), 'available (Python environment manager)', () => true, false),
    checkTool('node', selectCandidate(o.node, [process.execPath, ...onPath(win ? ['node.exe'] : ['node'])], cli(['--version'], /v(\d+\.\d+\.\d+)/)), `>=${r.nodeMajorMin}`, v => Number(v.split('.')[0]) >= r.nodeMajorMin),
    checkTool('git', selectCandidate(o.git, onPath(win ? ['git.exe'] : ['git']), cli(['--version'], /git version (\S+)/)), 'available', () => true),
    checkTool('creator', selectCandidate(o.creator, candidates.creator, creatorVersion, x => x.version === r.creatorVersion), r.creatorVersion, v => v === r.creatorVersion),
    checkTool('javaHome', selectCandidate(o.javaHome, candidates.javaHome, javaVersion, x => versionMatches(x.version, String(r.javaMajor))), String(r.javaMajor), v => versionMatches(v, String(r.javaMajor))),
    checkTool('wechatDevtools', selectCandidate(o.wechatDevtools, candidates.wechatDevtools, wechatVersion,x=>x.isWeChatDevtools!==false), 'WeChat DevTools; Mini Game import requires runtime validation', () => true),
    checkTool('androidStudio', selectCandidate(o.androidStudio, candidates.androidStudio, fileVersion), 'installed (IDE optional for command-line builds)', () => true, false),
    checkTool('python', selectCandidate(o.python, [pythonExecutable], inspectPython), 'Conda Python 3.11 + PyYAML 6.x (extraction tools)', v => versionMatches(v,'3.11'), false),
  ];
  const python = tools.find(t => t.id === 'python');
  const wechat=tools.find(t=>t.id==='wechatDevtools');
  if(wechat.isWeChatDevtools===false&&exists(wechat.path)){
    wechat.status='tool-mismatch';wechat.action='Selected executable is not verified as WeChat DevTools; set overrides.wechatDevtools to the Tencent WeChat developer tool';
  }
  if (python.status === 'found' && (!python.condaManaged || !versionMatches(python.pyyaml,'6'))) python.status = 'version-mismatch';
  if (python.status !== 'found') python.action = 'Run node tools/setup-python.mjs (creates dedicated Conda environment from environment.yml)';
  const sdk = selectCandidate(o.androidSdk, candidates.sdk, () => ({ version: null }), x => exists(path.join(x.path, 'platforms')));
  tools.push({ id: 'androidSdk', ...sdk, status: sdk.path && exists(path.join(sdk.path, 'platforms')) ? 'found' : 'missing', required: true, expected: r.androidPlatform, action: 'Install Android SDK or set overrides.androidSdk' });
  const components = sdkChecks(sdk.path && exists(sdk.path) ? sdk.path : null, r);
  const ready = ids => ids.every(id => tools.find(x => x.id === id)?.status === 'found');
  const resolvePaths = Object.fromEntries(tools.map(x => [x.id, x.path]));
  return {
    schemaVersion: 1, checkedAt: new Date().toISOString(), host: { platform: process.platform, arch: process.arch },
    requirements: r, overrides: o, resolved: resolvePaths, tools, androidComponents: components,
    readiness: {
      h5Prerequisites: ready(['node','git','creator']),
      wechatPrerequisites: ready(['node','git','creator','wechatDevtools']),
      androidPrerequisites: ready(['node','git','creator','javaHome','androidSdk']) && components.every(x => x.status === 'found'),
      pythonTools: ready(['conda','python']),
      buildVerified: false, deviceVerified: false,
    },
    manualChecks: ['Creator launch and project import', 'WeChat Mini Game support, login, project AppID and device preview', 'Cocos native compilation with selected NDK', 'Android device installation and execution'],
  };
}

export function renderReport(result) {
  const safe = s => String(s ?? '—').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
  const rows = result.tools.map(t => `| ${t.id} | ${safe(t.path)} | ${safe(t.version)} | ${t.status} | ${safe(t.expected)} |`);
  const components = result.androidComponents.map(t => `| ${t.id} | ${safe(t.version)} | ${t.status} | ${safe((t.installed || []).join(', '))} |`);
  const issues = [...result.tools.filter(t => t.status !== 'found'), ...result.androidComponents.filter(t => t.status !== 'found')];
  return `# 本机环境检查报告\n\n检查时间（Asia/Shanghai）：${new Intl.DateTimeFormat("zh-CN", {timeZone:"Asia/Shanghai",dateStyle:"medium",timeStyle:"medium"}).format(new Date(result.checkedAt))}\n\n系统：${result.host.platform} / ${result.host.arch}。此报告由 tools/check-environment.mjs 生成，不入库。\n\n## 工具配置\n\n| 工具 | 路径 | 检测版本 | 状态 | 要求 |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Android 组件\n\n| 组件 | 要求版本 | 状态 | 已安装版本 |\n| --- | --- | --- | --- |\n${components.join('\n')}\n\n## 待处理项\n\n${issues.length ? issues.map(t => '- ' + safe(t.id) + ': ' + safe(t.action) + (t.required === false ? '（不阻止基础 H5 工作）' : '')).join('\n') : '- 未发现静态依赖缺口。'}\n\n## 验证范围\n\n- H5 静态前置条件：${result.readiness.h5Prerequisites}\n- 微信静态前置条件：${result.readiness.wechatPrerequisites}\n- Android 静态前置条件：${result.readiness.androidPrerequisites}\n- 构建通过：未验证；设备运行：未验证。\n- ${result.manualChecks.join('\n- ')}\n\n本脚本仅探测路径/版本并生成工作区配置，不修改系统环境变量、Creator 偏好设置或安装工具。missing 表示未在已检查路径找到，不代表穷尽全机安装。文件存在不等于运行可用；所有导入、构建及设备结果需另行验证。resolved 是检测结果，人工指定路径请修改 overrides 后重跑。\n`;
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !['--write','--help'].includes(a))) throw new Error('Usage: node tools/check-environment.mjs [--write]');
  if (args.includes('--help')) { console.log('Read template + local overrides; inspect tools. --write generates environment.local.json and docs/ENVIRONMENT.local.md. Exit 2 means missing/unverified required prerequisites; exit 1 means script/config error.'); return; }
  const template = json(path.join(workspace, 'environment.example.json'));
  const localPath = path.join(workspace, 'environment.local.json');
  const local = exists(localPath) ? json(localPath) : {};
  if (template.schemaVersion !== 1 || (local.schemaVersion && local.schemaVersion !== 1)) throw new Error('Unsupported environment schema');
  const config = { requirements: { ...template.requirements, ...local.requirements }, overrides: { ...template.overrides, ...local.overrides } };
  validateConfig(config);
  const result = inspectEnvironment(config);
  if (args.includes('--write')) {
    fs.writeFileSync(localPath, JSON.stringify(result, null, 2) + '\n');
    fs.mkdirSync(path.join(workspace, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'docs/ENVIRONMENT.local.md'), renderReport(result));
  }
  for (const t of [...result.tools, ...result.androidComponents]) console.log(`${t.status.padEnd(17)} ${t.id}: ${t.version || '-'} ${t.path || '-'}`);
  console.log(JSON.stringify(result.readiness));
  if (result.tools.some(t => t.required && t.status !== 'found') || result.androidComponents.some(t => t.status !== 'found')) process.exitCode = 2;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
