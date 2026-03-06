import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjujqzssyvokeflfcipc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdWpxenNzeXZva2VmbGZjaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTQ0ODMsImV4cCI6MjA4ODM3MDQ4M30.fK9nNsXSRNRbgAQ-rNRTbB3qVjkujquKCMbV5afUSpQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);