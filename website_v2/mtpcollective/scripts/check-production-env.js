// Script to check production environment variables
// Run this after deploying to verify environment is configured correctly

const requiredEnvVars = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING', 
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('🔍 Checking production environment variables...\n');

let allSet = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const isSet = !!value;
  
  console.log(`${isSet ? '✅' : '❌'} ${envVar}: ${isSet ? 'Set' : 'Missing'}`);
  
  if (isSet && envVar === 'NEXTAUTH_URL') {
    const isProduction = value.includes('mtp-delta.vercel.app');
    console.log(`   ${isProduction ? '✅' : '⚠️'} URL: ${value} ${isProduction ? '(Production)' : '(Development)'}`);
  }
  
  if (!isSet) allSet = false;
});

console.log('\n' + '='.repeat(50));
console.log(`Overall status: ${allSet ? '✅ All required variables set' : '❌ Missing required variables'}`);

if (!allSet) {
  console.log('\n📖 See docs/production-deployment.md for setup instructions');
}

// Test database connection if all variables are set
if (allSet && process.env.POSTGRES_PRISMA_URL) {
  console.log('\n🔍 Testing database connection...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful');
      return prisma.user.findUnique({ where: { email: 'admin@mtpcollective.com' } });
    })
    .then(user => {
      console.log(`✅ Admin user: ${user ? 'Found' : 'Not found'}`);
      return prisma.$disconnect();
    })
    .catch(error => {
      console.error('❌ Database connection failed:', error.message);
      return prisma.$disconnect();
    });
} 