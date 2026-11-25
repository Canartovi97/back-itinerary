import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_IMPORT_PATTERNS = [
  '@nestjs',
  'typeorm',
  'express',
  'amqplib',
  'axios',
  'jsonwebtoken',
  'bcryptjs',
  'class-validator',
  'class-transformer',
  'pg',
];

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return collectTsFiles(fullPath);
    }
    return entry.endsWith('.ts') && !entry.endsWith('.spec.ts') ? [fullPath] : [];
  });
}

/**
 * Enforces the hexagonal architecture's core rule at the one layer where it
 * matters most: "el dominio no depende de frameworks externos ni de la BD".
 * Every file under src/domain (entities, value objects, ports/interfaces,
 * domain errors) must be importable with zero knowledge of NestJS, TypeORM,
 * Express, amqplib, or any other infrastructure concern — ports describe
 * *what* the domain needs, never *how* it's provided.
 */
describe('Domain layer purity (hexagonal architecture)', () => {
  const domainFiles = collectTsFiles(join(__dirname));

  it('found domain files to check (sanity check the scan itself works)', () => {
    expect(domainFiles.length).toBeGreaterThan(0);
  });

  it.each(domainFiles)('%s has no framework/infrastructure imports', (filePath) => {
    const content = readFileSync(filePath, 'utf-8');
    const importLines = content
      .split('\n')
      .filter((line) => /^\s*import\b/.test(line) || /require\(/.test(line));

    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      const offendingLine = importLines.find(
        (line) => line.includes(`'${pattern}`) || line.includes(`"${pattern}`),
      );
      expect(offendingLine).toBeUndefined();
    }
  });
});
