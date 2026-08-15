import { restoreTheoreticalComputingApostila, verifyAllApostilasIntegrity, repairAllCorruptedApostilas } from '../src/lib/content-recovery/recovery';
import { backupManager } from '../src/lib/content-recovery/backup-manager';

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🔄 APOSTILA RESTORATION PROTOCOL    ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const command = process.argv[2] || 'all';

    if (command === 'verify' || command === 'all') {
      console.log('STEP 1: Verifying apostila integrity...\n');
      const integrityReport = await verifyAllApostilasIntegrity();
      console.table(integrityReport.map(r => ({
        Title: r.title,
        Status: r.status,
        Pages: r.pageCount,
        Exercises: r.exerciseCount,
        NeedsRepair: r.needsRepair
      })));
      
      const needsRepair = integrityReport.filter(r => r.needsRepair);
      console.log(`\n⚠️  Found ${needsRepair.length} apostilas needing repair\n`);
    }

    if (command === 'restore' || command === 'all') {
      console.log('STEP 2: Restoring Theoretical Aspects of Computing apostila...\n');
      const restored = await restoreTheoreticalComputingApostila();
      console.log(`✅ Successfully restored with ${restored.pageCount} pages\n`);
    }

    if (command === 'repair' || command === 'all') {
      console.log('STEP 3: Repairing corrupted metadata...\n');
      await repairAllCorruptedApostilas();
    }

    if (command === 'backup' || command === 'all') {
      console.log('STEP 4: Creating full backup record...\n');
      await backupManager.createFullBackup();
    }

    if (command === 'all') {
      console.log('\nSTEP 5: Running final verification...\n');
      const finalReport = await verifyAllApostilasIntegrity();
      const allHealthy = finalReport.every(r => r.status.includes('✅'));

      if (allHealthy) {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   ✅ ALL APOSTILAS RESTORED & HEALTHY ║');
        console.log('╚════════════════════════════════════════╝\n');
      } else {
        console.log('\n⚠️  Some apostilas still need attention');
      }
    }

  } catch (error) {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  }
}

main();
