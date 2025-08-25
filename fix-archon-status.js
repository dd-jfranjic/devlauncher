const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArchonStatus() {
  try {
    console.log('🔧 Fixing Archon status in database...');
    
    // Update the status to 'running' since containers are actually running
    const updated = await prisma.systemService.update({
      where: { name: 'archon-global' },
      data: {
        status: 'running',
        lastError: null,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Status updated successfully:', updated.status);
    console.log('📊 Archon is now marked as running in the database');
    
  } catch (error) {
    console.error('❌ Error updating status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixArchonStatus();