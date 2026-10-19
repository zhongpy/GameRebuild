import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { findConda, condaProcessEnv, inspectPython, pythonPrefix, pythonExecutable, versionMatches } from './check-environment.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localPath = path.join(workspace, 'environment.local.json');
try {
  const local = fs.existsSync(localPath) ? JSON.parse(fs.readFileSync(localPath,'utf8').replace(/^\uFEFF/,'')) : {schemaVersion:1};
  const conda = findConda(local.overrides?.conda);
  if (!conda.version) throw new Error('Conda not found/runnable. Install Conda or set overrides.conda in environment.local.json.');
  if (!fs.existsSync(path.join(pythonPrefix,'conda-meta/history'))) {
    if (fs.existsSync(pythonPrefix)) throw new Error('Prefix exists without Conda metadata; inspect it before retrying. No files removed.');
    const child = spawnSync(conda.path, ['env','create','--prefix',pythonPrefix,'--file',path.join(workspace,'environment.yml'),'--no-default-packages'], {
      env: condaProcessEnv(conda.path), stdio:'inherit', windowsHide:true,
    });
    if (child.error || child.status !== 0) throw new Error(`Conda environment creation failed (${child.status}): ${child.error?.message || 'see output'}`);
  }
  const info = inspectPython(pythonExecutable);
  if (!info.condaManaged || !versionMatches(info.version,'3.11') || !versionMatches(info.pyyaml,'6')) throw new Error('Existing environment does not meet environment.yml. Review before updating; existing environments are never overwritten.');
  local.overrides = {...local.overrides, conda:conda.path, python:pythonExecutable};
  fs.writeFileSync(localPath,JSON.stringify(local,null,2)+'\n');
  console.log(`Conda Python ready: ${info.version}; PyYAML ${info.pyyaml}; ${pythonExecutable}`);
  console.log('Run node tools/check-environment.mjs --write to refresh the environment report.');
} catch(error) { console.error(error.message); process.exitCode=1; }
