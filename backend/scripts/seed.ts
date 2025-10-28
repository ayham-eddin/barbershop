/* eslint-disable no-console */
/* eslint-disable n/no-process-exit */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import ENV from '@src/common/constants/ENV';
import { Service } from '@src/models/Service';
import { Barber } from '@src/models/Barber';

async function run() {
  await mongoose.connect(ENV.MongoUri);

  console.log('⚙️  Clearing old data…');
  await Service.deleteMany({});
  await Barber.deleteMany({});

  console.log('➕ Inserting services…');
  const services = await Service.insertMany([
    { name: 'Haircut', durationMin: 30, price: 20 },
    { name: 'Beard Trim', durationMin: 20, price: 12 },
    { name: 'Combo Cut + Beard', durationMin: 50, price: 30 },
  ]);

  const sByName = new Map(services.map(s => [s.name, s._id]));

  console.log('💈 Inserting barbers…');
  const monFri: { day: 0|1|2|3|4|5|6, start: string, end: string }[] = [
    { day: 1, start: '09:00', end: '17:00' },
    { day: 2, start: '09:00', end: '17:00' },
    { day: 3, start: '09:00', end: '17:00' },
    { day: 4, start: '09:00', end: '17:00' },
    { day: 5, start: '09:00', end: '17:00' },
  ];

  await Barber.insertMany([
    {
      name: 'Ali',
      workingHours: monFri,
      services: [
        sByName.get('Haircut') as Types.ObjectId,
        sByName.get('Beard Trim') as Types.ObjectId,
      ],
    },
    {
      name: 'Omar',
      workingHours: monFri,
      services: [
        sByName.get('Haircut') as Types.ObjectId,
        sByName.get('Combo Cut + Beard') as Types.ObjectId,
      ],
    },
  ]);

  console.log('✅ Seed done');
  await mongoose.disconnect();
}

run().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
