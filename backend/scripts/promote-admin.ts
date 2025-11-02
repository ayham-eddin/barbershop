// scripts/promote-admin.ts
import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx -r ./src/config/loadEnv.ts scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGO_URI in env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const updated = await User.findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { new: true }
  ).lean();

  if (!updated) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log('✅ Promoted to admin:', {
    id: updated._id?.toString?.(),
    email: updated.email,
    role: updated.role,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
