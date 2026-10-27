export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    // Header CORS agar API bisa diakses dari web/aplikasi manapun
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
        JSON.stringify({ error: "Parameter 'username' wajib diisi. Contoh: ?username=Roblox" }),
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // 1. Cari user berdasarkan keyword dari API Roblox
      const searchRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
      
      if (!searchRes.ok) {
        throw new Error("Gagal terhubung ke server pencarian Roblox");
      }

      const searchData = await searchRes.json();
      const users = searchData.data || [];

      if (users.length === 0) {
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Ambil daftar ID user yang ditemukan
      const userIds = users.map(user => user.id);

      // 2. Ambil gambar Headshot (ikon wajah) dan Full Body (avatar penuh) secara paralel
      const [headshotRes, avatarRes] = await Promise.all([
        fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(',')}&size=150x150&format=Png&isCircular=false`),
        fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userIds.join(',')}&size=420x420&format=Png&isCircular=false`)
      ]);

      const headshotData = headshotRes.ok ? await headshotRes.json() : { data: [] };
      const avatarData = avatarRes.ok ? await avatarRes.json() : { data: [] };

      // Buat pemetaan (mapping) URL gambar berdasarkan ID user
      const headshotMap = {};
      (headshotData.data || []).forEach(item => {
        headshotMap[item.targetId] = item.imageUrl;
      });

      const avatarMap = {};
      (avatarData.data || []).forEach(item => {
        avatarMap[item.targetId] = item.imageUrl;
      });

      // 3. Gabungkan data user dengan link gambar avatarnya
      const enrichedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        hasVerifiedBadge: user.hasVerifiedBadge || false,
        avatarHeadshotUrl: headshotMap[user.id] || null, // URL foto wajah
        avatarFullUrl: avatarMap[user.id] || null        // URL foto badan penuh
      }));

      return new Response(JSON.stringify({ success: true, data: enrichedUsers }), {
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
