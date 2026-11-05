
const $ = s => document.querySelector(s);
const app = $("#app");

const escAdmin = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;",
  '"': "&quot;", "'": "&#39;"
}[c]));

function message(t, err = false) {
  const el = $("#notice");
  if (el) {
    el.className = "msg" + (err ? " e" : "");
    el.textContent = t;
  }
}

function loginView() {
  app.innerHTML = `
    <div class="w" style="max-width:480px;padding:36px 16px 50px">
      <h1>অ্যাডমিন লগইন</h1>
      <p>ওয়েবসাইট পরিচালনার জন্য লগইন করুন।</p>
      <div id="notice"></div>
      <form class="f" id="loginForm">
        <input type="email" name="email" placeholder="ইমেইল" required>
        <input type="password" name="password" placeholder="পাসওয়ার্ড" required>
        <button class="btn">লগইন</button>
      </form>
    </div>`;

  $("#loginForm").onsubmit = async e => {
    e.preventDefault();

    if (!LIVE) {
      message("Supabase URL ও Public Key যুক্ত করুন।", true);
      return;
    }

    const b = e.target.querySelector("button");
    b.disabled = true;
    b.textContent = "প্রবেশ করা হচ্ছে...";

    try {
      const f = Object.fromEntries(new FormData(e.target));
      const { data, error } = await sb.auth.signInWithPassword(f);

      if (error) throw error;

      const { data: ad, error: ae } = await sb
        .from("admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (ae) throw ae;

      if (!ad) {
        await sb.auth.signOut();
        throw new Error("এই অ্যাকাউন্টের Admin অনুমতি নেই।");
      }

      await dashboard();

    } catch (err) {
      message("লগইন করা যায়নি: " + err.message, true);
    }

    b.disabled = false;
    b.textContent = "লগইন";
  };
}


// Google Drive Link থেকে File ID বের করা
function getDriveEmbedUrl(url) {
  try {
    const u = new URL(url.trim());
    let id = "";

    if (u.hostname === "drive.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      id = match ? match[1] : u.searchParams.get("id");
    }

    if (!id && u.hostname === "docs.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      id = match ? match[1] : "";
    }

    if (!id) return null;

    return "https://drive.google.com/file/d/" +
      encodeURIComponent(id) + "/preview";

  } catch {
    return null;
  }
}


async function dashboard() {
  const { data: auth } = await sb.auth.getUser();

  if (!auth.user) {
    loginView();
    return;
  }

  const { data: admin, error: adminError } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (adminError) throw adminError;

  if (!admin) {
    await sb.auth.signOut();
    loginView();
    return;
  }

  const [videoResult, catResult] = await Promise.all([
    sb.from("videos")
      .select("*,categories(name)")
      .order("created_at", { ascending: false }),

    sb.from("categories")
      .select("*")
      .order("name")
  ]);

  if (videoResult.error) throw videoResult.error;
  if (catResult.error) throw catResult.error;

  const videos = videoResult.data || [];
  const cats = catResult.data || [];

  app.innerHTML = `
    <div class="w" style="padding-top:24px;padding-bottom:40px">

      <div class="row" style="justify-content:space-between">
        <h1>অ্যাডমিন ড্যাশবোর্ড</h1>
        <button class="btn o" id="logout">লগআউট</button>
      </div>

      <div class="stats">
        <div class="stat">${videos.length}<br><small>মোট ভিডিও</small></div>
        <div class="stat">${cats.length}<br><small>ক্যাটাগরি</small></div>
        <div class="stat">${videos.reduce((n,v)=>n+(v.views||0),0)}<br><small>মোট ভিউ</small></div>
      </div>

      <h2 style="margin-top:26px">নতুন ভিডিও যোগ করুন</h2>

      <div id="notice"></div>

      <form class="f" id="videoForm">

        <input name="title" placeholder="ভিডিওর নাম" required>

        <textarea name="description" rows="3"
          placeholder="ভিডিওর বিবরণ"></textarea>

        <label>ভিডিও ক্যাটাগরি</label>

        <select name="category_id" required>
          <option value="">ক্যাটাগরি নির্বাচন করুন</option>
          ${cats.map(c => `
            <option value="${c.id}">${escAdmin(c.name)}</option>
          `).join("")}
        </select>

        <label>ভিডিও যোগ করার পদ্ধতি</label>

        <select id="videoMethod" name="video_method">
          <option value="drive">Google Drive Link</option>
          <option value="upload">সরাসরি ভিডিও Upload</option>
        </select>

        <div id="driveArea">
          <label>Google Drive Video Link</label>
          <input
            type="url"
            id="driveLink"
            placeholder="https://drive.google.com/file/d/..."
          >
          <small>Google Drive Sharing: Anyone with the link - Viewer করুন।</small>
        </div>

        <div id="uploadArea" style="display:none">
          <label>ভিডিও ফাইল নির্বাচন করুন</label>
          <input type="file" id="videoFile" accept="video/*">
        </div>

        <label>Thumbnail ছবি</label>
        <input type="file" id="thumbFile" accept="image/*">

        <input name="duration"
          placeholder="ভিডিওর দৈর্ঘ্য, যেমন ১২:৩০">

        <label>
          <input type="checkbox" name="allow_download">
          ডাউনলোডের অনুমতি দিন
        </label>

        <label>
          <input type="checkbox" name="published" checked>
          ভিডিও প্রকাশ করুন
        </label>

        <button class="btn" type="submit">
          ভিডিও সংরক্ষণ করুন
        </button>

      </form>

      <h2 style="margin-top:30px">ভিডিও পরিচালনা</h2>

      <div style="overflow:auto">
        <table>
          <thead>
            <tr>
              <th>নাম</th>
              <th>ক্যাটাগরি</th>
              <th>অবস্থা</th>
              <th>ভিউ</th>
              <th>কাজ</th>
            </tr>
          </thead>

          <tbody>
            ${videos.map(v => `
              <tr>
                <td>${escAdmin(v.title)}</td>
                <td>${escAdmin(v.categories?.name || "অন্যান্য")}</td>
                <td>${v.published ? "প্রকাশিত" : "খসড়া"}</td>
                <td>${v.views || 0}</td>
                <td>
                  <button class="chip"
                    data-toggle="${v.id}"
                    data-pub="${!v.published}">
                    ${v.published ? "লুকান" : "প্রকাশ"}
                  </button>

                  <button class="chip" data-delete="${v.id}">
                    মুছুন
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;


  // Logout
  $("#logout").onclick = async () => {
    await sb.auth.signOut();
    loginView();
  };


  // Video method selection
  const method = $("#videoMethod");

  method.onchange = () => {
    const drive = method.value === "drive";

    $("#driveArea").style.display = drive ? "block" : "none";
    $("#uploadArea").style.display = drive ? "none" : "block";

    $("#driveLink").required = drive;
    $("#videoFile").required = !drive;
  };

  method.onchange();


  // Save video
  $("#videoForm").onsubmit = async e => {
    e.preventDefault();

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "সংরক্ষণ হচ্ছে...";

    try {
      const f = new FormData(e.target);

      const title = f.get("title");
      const thumb = $("#thumbFile").files[0];
      const video = $("#videoFile").files[0];

      const safe = name =>
        Date.now() + "-" + name.replace(/[^a-zA-Z0-9._-]/g, "_");

      let videoUrl = "";

      // Google Drive method
      if (method.value === "drive") {
        const link = $("#driveLink").value.trim();

        videoUrl = getDriveEmbedUrl(link);

        if (!videoUrl) {
          throw new Error("সঠিক Google Drive Video Link দিন।");
        }
      }

      // Direct upload method
      else {
        if (!video) {
          throw new Error("ভিডিও ফাইল নির্বাচন করুন।");
        }

        const videoPath = safe(video.name);

        const { error } = await sb.storage
          .from("videos")
          .upload(videoPath, video, { upsert: false });

        if (error) throw error;

        const { data } = sb.storage
          .from("videos")
          .getPublicUrl(videoPath);

        videoUrl = data.publicUrl;
      }


      // Thumbnail upload
      let thumbnailUrl = null;

      if (thumb) {
        const thumbPath = safe(thumb.name);

        const { error } = await sb.storage
          .from("thumbnails")
          .upload(thumbPath, thumb, { upsert: false });

        if (error) throw error;

        const { data } = sb.storage
          .from("thumbnails")
          .getPublicUrl(thumbPath);

        thumbnailUrl = data.publicUrl;
      }


      // Database save
      const payload = {
        title,
        description: f.get("description"),
        category_id: f.get("category_id"),
        duration: f.get("duration"),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        allow_download: f.has("allow_download"),
        published: f.has("published")
      };

      const { error } = await sb
        .from("videos")
        .insert(payload);

      if (error) throw error;

      alert("ভিডিও সফলভাবে সংরক্ষণ হয়েছে!");

      await dashboard();

    } catch (err) {
      message("সংরক্ষণ করা যায়নি: " + err.message, true);
    }

    btn.disabled = false;
    btn.textContent = "ভিডিও সংরক্ষণ করুন";
  };


  // Publish / Unpublish
  app.querySelectorAll("[data-toggle]").forEach(b => {
    b.onclick = async () => {
      const { error } = await sb
        .from("videos")
        .update({ published: b.dataset.pub === "true" })
        .eq("id", b.dataset.toggle);

      if (error) {
        message("পরিবর্তন করা যায়নি: " + error.message, true);
      } else {
        await dashboard();
      }
    };
  });


  // Delete video
  app.querySelectorAll("[data-delete]").forEach(b => {
    b.onclick = async () => {
      if (!confirm("ভিডিওটি মুছে ফেলতে চান?")) return;

      const { error } = await sb
        .from("videos")
        .delete()
        .eq("id", b.dataset.delete);

      if (error) {
        message("মুছতে সমস্যা হয়েছে: " + error.message, true);
      } else {
        await dashboard();
      }
    };
  });
}


// Start application
if (!LIVE) {
  loginView();
} else {
  sb.auth.getSession().then(({ data, error }) => {
    if (error) {
      loginView();
    } else if (data.session) {
      dashboard().catch(err => {
        app.innerHTML = `<div class="w msg e">ড্যাশবোর্ড লোড করা যায়নি: ${escAdmin(err.message)}</div>`;
      });
    } else {
      loginView();
    }
  });
}
