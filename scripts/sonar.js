#!/usr/bin/env node
/**
 * Runs the SonarQube scanner (Docker image) against this repository, so no
 * scanner has to be installed locally. Reads sonar-project.properties.
 *
 *   SONAR_TOKEN=<token> npm run sonar
 *
 * SONAR_HOST_URL defaults to the local server from docker-compose.sonar.yml;
 * from inside the scanner container the host is host.docker.internal.
 */
const { spawnSync } = require('node:child_process');

const token = process.env.SONAR_TOKEN;
if (!token) {
  console.error('SONAR_TOKEN is not set. Create one in SonarQube: My Account > Security.');
  process.exit(1);
}

const hostUrl = process.env.SONAR_HOST_URL ?? 'http://host.docker.internal:9000';
const result = spawnSync(
  'docker',
  [
    'run', '--rm',
    '--add-host=host.docker.internal:host-gateway',
    '-e', `SONAR_HOST_URL=${hostUrl}`,
    '-e', `SONAR_TOKEN=${token}`,
    '-v', `${process.cwd()}:/usr/src`,
    'sonarsource/sonar-scanner-cli:11.1',
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
