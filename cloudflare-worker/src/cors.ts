/**
 * CORS configuration for Cloudflare Workers
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Configure this based on your needs
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};