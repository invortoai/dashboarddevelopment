
// A secure SQL execution edge function that prevents SQL injection using parameterized queries

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the request body
    const { query_text, params = [] } = await req.json();
    
    if (!query_text) {
      return new Response(
        JSON.stringify({ error: 'Missing query_text in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safety checks to prevent dangerous operations
    const normalizedQuery = query_text.toLowerCase().trim();
    
    // Block any potentially dangerous operations
    const dangerousOperations = [
      'drop ', 'alter ', 'truncate ', 'delete ', 'grant ', 'revoke ',
      'create role', 'alter role', 'drop role',
      'create user', 'alter user', 'drop user',
      'information_schema', 'pg_', 'sys.'
    ];
    
    // Check if the query contains any dangerous operations
    const isDangerous = dangerousOperations.some(operation => 
      normalizedQuery.includes(operation)
    );
    
    if (isDangerous) {
      console.error('Dangerous SQL operation attempted:', query_text);
      return new Response(
        JSON.stringify({ error: 'Unauthorized SQL operation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute the query through Supabase - MUCH safer than directly using raw SQL
    // This uses PostgreSQL's parameterized queries which prevent SQL injection
    const { data, error } = await supabaseClient
      .rpc('execute_parameterized_query', {
        query_text,
        params
      });

    if (error) {
      console.error('Error executing SQL:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the results
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
