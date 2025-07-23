#!/usr/bin/env node
import { QueryBuilder } from './dist/utils/query-builder.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing QueryBuilder Output\n');

const databases = {
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c'
};

const daysAgo = new Date();
daysAgo.setDate(daysAgo.getDate() - 30);

const query = QueryBuilder.buildSelectQuery(
  databases.productHistories,
  ['DATE', 'BUYBOXPRICE', 'SALESRANK', 'ESTIMATEDUNITSALES',
   'REVIEWS', 'RATING', 'NUMBEROFSELLERS'],
  {
    filters: {
      PRODUCTID: '103542704',
      DATE: { min: daysAgo.toISOString().split('T')[0] }
    },
    limit: 30,
    orderBy: 'DATE',
    orderDirection: 'DESC'
  }
);

console.log('Generated Query:');
console.log(query);
console.log('\nExpected Query:');
console.log(`SELECT DATE, BUYBOXPRICE, SALESRANK, ESTIMATEDUNITSALES, REVIEWS, RATING, NUMBEROFSELLERS FROM dataset WHERE PRODUCTID = '103542704' AND DATE >= '${daysAgo.toISOString().split('T')[0]}' ORDER BY DATE DESC LIMIT 30`);