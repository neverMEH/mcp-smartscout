#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;

console.log('Searching for BRANDCOVERAGES dataset...\n');

// The incorrect ID
const wrongId = '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c4';

// Try with extra digit variations
const variations = [
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c40',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c41',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c42',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c43',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c44',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c45',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c46',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c47',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c48',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c49',
  '602fa4e9-4e0c-4f3b-b66f-4f2bd52643c4', // Swapped digits
  '602fa4e9-4e0c-4f3b-b66f-42f2bd5263c4', // Extra 2
  '602fa4e9-4e0c-4f3b-b66f-f42bd5263c4',  // Extra f
];

async function findDataset() {
  console.log(`Checking variations of: ${wrongId}\n`);
  
  for (const id of variations) {
    try {
      const response = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${id}?part=core`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log(`✅ FOUND! ${id} = "${response.data.name}"`);
      return id;
    } catch (error) {
      // Silent fail - we're just probing
    }
  }
  
  console.log('❌ None of the variations worked.');
  console.log('\nThe brandCoverages dataset ID might be completely different.');
  console.log('You may need to:');
  console.log('1. Log into Domo and search for "BRANDCOVERAGES"');
  console.log('2. Get the correct dataset ID from the URL or dataset details');
  console.log('3. Update the dataset-ids.ts file with the correct ID');
}

findDataset().catch(console.error);