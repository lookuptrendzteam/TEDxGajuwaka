
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Speaker = {
  id: number;
  name: string;
  talk_title: string;
  bio: string | null;
  photo_url: string;
  event_year: number | null;
};

export default function ManageSpeakers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [name, setName] = useState("");
  const [talkTitle, setTalkTitle] = useState("");
  const [bio, setBio] = useState("");
  const [year, setYear] = useState("2027");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        const { data: admin } = await supabase
          .from("site_admins")
          .select("user_id")
          .eq("user_id", data.session.user.id)
          .maybeSingle();

        if (active && admin) {
          setSignedIn(true);
          await loadSpeakers();
        } else if (active) {
          setMessage("This account is not an authorized administrator.");
        }
      }
      if (active) setChecking(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadSpeakers() {
    const { data, error } = await supabase
      .from("speaker_gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setSpeakers((data ?? []) as Speaker[]);
  }

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("site_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setMessage("Login succeeded, but this account is not an authorized administrator.");
      return;
    }

    setSignedIn(true);
    setMessage("Signed in successfully.");
    await loadSpeakers();
  }

  async function addSpeaker(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!photo) {
      setMessage("Please select a speaker photo.");
      return;
    }

    if (!photo.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (photo.size > 5 * 1024 * 1024) {
      setMessage("Image must be 5 MB or smaller.");
      return;
    }

    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setMessage("Your session expired. Please sign in again.");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("site_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        setMessage("Your account is not authorized to upload speakers.");
        return;
      }

      const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("tedx-gallery")
        .upload(filePath, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Photo upload failed: ${uploadError.message}`);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("tedx-gallery")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("speaker_gallery")
        .insert({
          name: name.trim(),
          talk_title: talkTitle.trim(),
          bio: bio.trim() || null,
          photo_url: publicData.publicUrl,
          event_year: year ? Number(year) : null,
        });

      if (insertError) {
        setMessage(`Speaker save failed: ${insertError.message}`);
        return;
      }

      setName("");
      setTalkTitle("");
      setBio("");
      setYear("2027");
      setPhoto(null);

      const form = e.currentTarget;
      form.reset();

      setMessage("Speaker added successfully!");
      await loadSpeakers();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSpeaker(speaker: Speaker) {
    if (!window.confirm(`Delete ${speaker.name} from the gallery?`)) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage("Please sign in again.");
      return;
    }

    const { data: admin } = await supabase
      .from("site_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!admin) {
      setMessage("Administrator permission required.");
      return;
    }

    const { error } = await supabase
      .from("speaker_gallery")
      .delete()
      .eq("id", speaker.id);

    if (error) setMessage(error.message);
    else {
      setSpeakers((current) =>
        current.filter((item) => item.id !== speaker.id)
      );
      setMessage("Speaker removed from the gallery.");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    background: "#171717",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 16,
  } as const;

  const buttonStyle = {
    padding: "13px 18px",
    border: 0,
    borderRadius: 8,
    background: "#eb0028",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  if (checking) {
    return <main style={{ padding: 30, background: "#080808", color: "white", minHeight: "100vh" }}>Checking admin access…</main>;
  }

  if (!signedIn) {
    return (
      <main style={{ minHeight: "100vh", background: "#080808", color: "#fff", padding: "36px 20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <p style={{ color: "#eb0028", letterSpacing: 3 }}>TEDxGAJUWAKA · ADMIN</p>
          <h1 style={{ fontSize: 42 }}>Speaker Gallery</h1>
          <p>Sign in with your authorized administrator account to manage previous speakers.</p>

          <form onSubmit={signIn}>
            <label>Email</label>
            <input style={inputStyle} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label>Password</label>
            <input style={inputStyle} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <button style={buttonStyle} type="submit">SIGN IN</button>
          </form>

          {message && <p role="status">{message}</p>}
          <p><a href="/admin" style={{ color: "#ff7777" }}>← Back to Admin Dashboard</a></p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "#fff", padding: "32px 18px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "#eb0028", letterSpacing: 3 }}>TEDxGAJUWAKA · ADMIN</p>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>Manage Speakers</h1>
        <p>Add photographs and details from previous TEDx events.</p>

        <form onSubmit={addSpeaker} style={{ background: "#141414", border: "1px solid #333", borderRadius: 14, padding: 20, margin: "28px 0" }}>
          <label>Speaker full name</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Talk title</label>
          <input style={inputStyle} value={talkTitle} onChange={(e) => setTalkTitle(e.target.value)} required />

          <label>Short biography</label>
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={bio} onChange={(e) => setBio(e.target.value)} />

          <label>Event year</label>
          <input style={inputStyle} type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} />

          <label>Speaker photo (maximum 5 MB)</label>
          <input
            style={inputStyle}
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            required
          />

          <button style={buttonStyle} type="submit" disabled={saving}>
            {saving ? "UPLOADING…" : "UPLOAD SPEAKER"}
          </button>
        </form>

        {message && <p role="status">{message}</p>}

        <h2>Previous speakers ({speakers.length})</h2>

        {speakers.length === 0 && <p>No speakers added yet.</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {speakers.map((speaker) => (
            <article key={speaker.id} style={{ background: "#151515", border: "1px solid #333", borderRadius: 12, overflow: "hidden" }}>
              <img
                src={speaker.photo_url}
                alt={speaker.name}
                style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>{speaker.name}</h3>
                <p>{speaker.talk_title}</p>
                {speaker.event_year && <small>Event year: {speaker.event_year}</small>}
                {speaker.bio && <p>{speaker.bio}</p>}
                <div>
                  <button type="button" style={buttonStyle} onClick={() => deleteSpeaker(speaker)}>
                    DELETE
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 30 }}>
          <a href="/admin" style={{ color: "#ff7777" }}>← Back to Admin Dashboard</a>
          {" · "}
          <a href="/" style={{ color: "#ff7777" }}>View website</a>
        </p>
      </div>
    </main>
  );
}
