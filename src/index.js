export default {
  async fetch(request, env, ctx) {
    // 1. Definisikan header CORS untuk akses dari frontend mana pun
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Tangani preflight request dari browser
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Ambil parameter 'keyword' dari URL query string
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Missing required 'keyword' query parameter" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    try {
      // 3. Request ke API Resmi Roblox (Maksimal limit yang diizinkan Roblox adalah 100)
      const robloxApiUrl = `https://roblox.com{encodeURIComponent(keyword)}&limit=10`;
      
      const robloxResponse = await fetch(robloxApiUrl, {
        method: "GET",
        headers: {
          "User-Agent": "CloudflareWorker-RobloxSearchAPI/1.0",
          "Accept": "application/json"
        }
      });

      if (!robloxResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Roblox API responded with an error" }), 
          { 
            status: robloxResponse.status, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // 4. Kembalikan data sukses ke client
      const data = await robloxResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Internal Server Error", message: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  },
};
    
