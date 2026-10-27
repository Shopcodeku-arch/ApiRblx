export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    // Header CORS agar API bisa diakses dari web lain
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Parameter 'username' wajib diisi. Contoh: ?animasi=1 atau ?username=Roblox" }),
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Memanggil API resmi Roblox User Search
      const robloxRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
      
      if (!robloxRes.ok) {
        throw new Error("Gagal terhubung ke server Roblox");
      }

      const data = await robloxRes.json();

      return new Response(JSON.stringify({ success: true, data: data.data }), {
        status: 200,
        headers: corsHeaders,
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
