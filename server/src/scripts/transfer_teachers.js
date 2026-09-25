#!/usr/bin/env node
/**
 * Node.js Category-Wise Teacher Data Transfer Script (SQL/NDJSON -> MongoDB)
 * Ray-Martin-CRM | Teacher Master Data Pipeline
 *
 * Usage:
 *   node src/scripts/transfer_teachers.js --category=ALL
 *   node src/scripts/transfer_teachers.js --category=School
 *   node src/scripts/transfer_teachers.js --category="Private Tutor"
 *   node src/scripts/transfer_teachers.js --class=10
 *   node src/scripts/transfer_teachers.js --stats
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  // Prisma available inside docker container
}

const DEFAULT_NDJSON_PATH = '/tmp/canvee_teachers_all.ndjson';
const BATCH_SIZE = 1000;

// Parse Command Line Arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      args[key] = val !== undefined ? val : true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const ndjsonPath = args.file || DEFAULT_NDJSON_PATH;
  const categoryFilter = args.category || 'ALL'; // 'ALL', 'School', 'Private Tutor'
  const classFilter = args.class || null; // e.g. '10', '12'
  const districtFilter = args.district || null;
  const isStatsOnly = Boolean(args.stats);
  const limit = args.limit ? parseInt(args.limit, 10) : null;
  const shouldDrop = Boolean(args.drop);

  console.log('\n======================================================');
  console.log('  🚀 Ray-Martin CRM: Category-Wise Teacher Transfer');
  console.log('======================================================');
  console.log(`📁 Source:       ${ndjsonPath}`);
  console.log(`🏷️  Category:     ${categoryFilter}`);
  console.log(`🎓 Class Filter: ${classFilter || 'All Classes'}`);
  console.log(`📍 District:     ${districtFilter || 'All Districts'}`);
  console.log(`⚡ Mode:         ${isStatsOnly ? 'Statistics Report Only' : 'Database Transfer'}`);
  console.log('======================================================\n');

  if (!fs.existsSync(ndjsonPath)) {
    console.error(`[-] Error: File not found at ${ndjsonPath}`);
    console.error(`    Please run the Python extractor first or specify a valid file using --file=<path>`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(ndjsonPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let totalScanned = 0;
  let matchingCount = 0;
  let schoolCount = 0;
  let privateCount = 0;
  const classStats = {};
  const districtStats = {};

  const batch = [];
  let totalInserted = 0;
  const startTime = Date.now();

  if (shouldDrop && !isStatsOnly) {
    if (!prisma) {
      console.error('[-] Prisma client is not installed on the host machine.');
      console.error('    Please run inside Docker: docker compose exec crm-server node src/scripts/transfer_teachers.js');
      console.error('    Or use the Python runner: ./transfer_teachers.sh');
      process.exit(1);
    }
    console.log('[*] Clearing existing Teacher collection...');
    if (categoryFilter !== 'ALL') {
      await prisma.teacher.deleteMany({ where: { categoryType: categoryFilter } });
      console.log(`[+] Deleted existing teachers where categoryType = '${categoryFilter}'`);
    } else {
      await prisma.teacher.deleteMany({});
      console.log('[+] Cleared entire Teacher collection');
    }
  }

  if (!isStatsOnly && !prisma) {
    console.error('[-] Note: Prisma is not installed locally on host (it is installed inside crm-server Docker container).');
    console.error('    To transfer into MongoDB from host, use the Python runner:');
    console.error('      ./src/scripts/transfer_teachers.sh --category ' + categoryFilter);
    console.error('    Or run inside Docker container:');
    console.error('      docker compose exec crm-server node src/scripts/transfer_teachers.js --category=' + categoryFilter);
    process.exit(1);
  }

  console.log('[*] Processing records stream...');

  for await (const line of rl) {
    if (!line.trim()) continue;
    totalScanned++;

    try {
      const doc = JSON.parse(line);
      const cat = doc.categoryType || 'School';

      // Category Filter
      if (categoryFilter !== 'ALL' && cat.toLowerCase() !== categoryFilter.toLowerCase()) {
        continue;
      }

      // Class Filter
      const docClasses = Array.isArray(doc.classes) ? doc.classes : [];
      if (classFilter && classFilter !== 'ALL') {
        const allowed = classFilter.split(',').map((c) => c.trim());
        if (!docClasses.some((c) => allowed.includes(c))) {
          continue;
        }
      }

      // District Filter
      if (districtFilter && districtFilter !== 'ALL') {
        if ((doc.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
          continue;
        }
      }

      matchingCount++;
      if (cat === 'Private Tutor') privateCount++;
      else schoolCount++;

      docClasses.forEach((c) => {
        classStats[c] = (classStats[c] || 0) + 1;
      });

      const d = doc.district || 'Unknown';
      districtStats[d] = (districtStats[d] || 0) + 1;

      if (!isStatsOnly) {
        batch.push({
          name: doc.name || 'Unnamed',
          phone: doc.phone || '',
          email: doc.email || null,
          subject: doc.subject || (doc.subjects && doc.subjects[0]) || 'General',
          subjects: Array.isArray(doc.subjects) ? doc.subjects : [],
          classes: docClasses,
          categoryType: cat,
          schoolType: doc.schoolType || (cat === 'Private Tutor' ? 'Private Coaching' : 'HS School'),
          schoolName: doc.schoolName || (cat === 'Private Tutor' ? 'Private Tuition Center' : 'School'),
          district: doc.district || null,
          zone: doc.zone || null,
          board: doc.board || null,
          designation: doc.designation || (cat === 'Private Tutor' ? 'Private Tutor' : 'Subject Teacher'),
        });

        if (batch.length >= BATCH_SIZE) {
          await prisma.teacher.createMany({
            data: batch,
          });
          totalInserted += batch.length;
          batch.length = 0; // Clear batch
          const rate = Math.round(totalInserted / ((Date.now() - startTime) / 1000));
          process.stdout.write(`\r[+] Ingested ${totalInserted.toLocaleString()} teachers (${rate.toLocaleString()} docs/sec)...`);
        }
      }

      if (limit && matchingCount >= limit) {
        break;
      }
    } catch (err) {
      continue;
    }
  }

  // Insert remaining batch
  if (!isStatsOnly && batch.length > 0) {
    await prisma.teacher.createMany({
      data: batch,
    });
    totalInserted += batch.length;
    batch.length = 0;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n======================================================');
  console.log('       📊 TRANSFER & CATEGORY REPORT SUMMARY');
  console.log('======================================================');
  console.log(`Total Records Scanned:  ${totalScanned.toLocaleString()}`);
  console.log(`Matching Teachers:      ${matchingCount.toLocaleString()}`);
  if (!isStatsOnly) {
    console.log(`Total Ingested:         ${totalInserted.toLocaleString()} documents in ${duration}s`);
  }
  console.log('------------------------------------------------------');
  console.log('CATEGORIES:');
  console.log(`  🏫 School Teachers:         ${schoolCount.toLocaleString()} (${((schoolCount / matchingCount) * 100).toFixed(1)}%)`);
  console.log(`  👨‍🏫 Private Tutors / Others:  ${privateCount.toLocaleString()} (${((privateCount / matchingCount) * 100).toFixed(1)}%)`);
  console.log('------------------------------------------------------');
  console.log('CLASS BREAKDOWN:');
  ['5', '6', '7', '8', '9', '10', '11', '12'].forEach((c) => {
    const cnt = classStats[c] || 0;
    const pct = matchingCount ? ((cnt / matchingCount) * 100).toFixed(1) : 0;
    console.log(`  Class ${c.padStart(2)}: ${cnt.toString().padStart(7)} (${pct}%)`);
  });
  console.log('------------------------------------------------------');
  console.log('TOP 5 DISTRICTS:');
  Object.entries(districtStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([dist, cnt]) => {
      console.log(`  ${dist.padEnd(20)}: ${cnt.toLocaleString()}`);
    });
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('\n[-] Transfer failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
