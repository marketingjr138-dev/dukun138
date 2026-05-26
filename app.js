const KEY = "slotGuidePwaConfigV1";
const REMOTE_CACHE_KEY = "slotGuideRemoteConfigCacheV1";
const ACTIVE_TAB_KEY = "slotGuideActiveTabV1";
const GAS_URL_KEY = "slotGuideGasApiUrlV1";
let config = loadConfig();
let activeTab = getInitialTab();

const $ = (id) => document.getElementById(id);

function loadConfig(){
  try{
    const local = JSON.parse(localStorage.getItem(KEY) || "null");
    return mergeConfig(window.DEFAULT_CONFIG, local || {});
  }catch(e){
    return window.DEFAULT_CONFIG;
  }
}

function mergeConfig(base, incoming){
  return {
    ...base,
    ...incoming,
    guides: {...base.guides, ...(incoming.guides || {})},
    faq: incoming.faq || base.faq
  };
}

function getInitialTab(){
  const hash = (location.hash || "").replace("#", "");
  const allowed = ["daftar", "deposit", "transfer", "promo"];
  if(allowed.includes(hash)) return hash;
  const saved = localStorage.getItem(ACTIVE_TAB_KEY);
  return allowed.includes(saved) ? saved : "daftar";
}

async function pullRemoteConfig(){
  if(!window.AUTO_PULL_CONFIG) return;
  const gasUrl = getGasApiUrl();
  const source = window.CONFIG_SOURCE || "auto";

  if(gasUrl && (source === "auto" || source === "gas")){
    try{
      const res = await fetch(`${gasUrl}?action=getConfig&v=${Date.now()}`, {cache: "no-store"});
      if(!res.ok) throw new Error("GAS fetch failed");
      const payload = await res.json();
      if(payload && payload.ok === false) throw new Error(payload.error || "GAS payload error");
      const remote = payload.config || payload;
      localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(remote));
      const localOverride = JSON.parse(localStorage.getItem(KEY) || "null");
      config = mergeConfig(window.DEFAULT_CONFIG, remote);
      if(localOverride && localOverride.__localOverride === true){
        config = mergeConfig(config, localOverride);
      }
      render();
      setPullStatus("Konten terbaru berhasil ditarik dari Google Sheet.");
      return;
    }catch(err){
      setPullStatus("Gagal pull Google Sheet. Mencoba fallback config.json...");
      if(source === "gas") return;
    }
  }

  if(!window.CONFIG_URL) return;
  try{
    const url = `${window.CONFIG_URL}?v=${Date.now()}`;
    const res = await fetch(url, {cache: "no-store"});
    if(!res.ok) throw new Error("Config fetch failed");
    const remote = await res.json();
    localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(remote));
    const localOverride = JSON.parse(localStorage.getItem(KEY) || "null");
    config = mergeConfig(window.DEFAULT_CONFIG, remote);
    if(localOverride && localOverride.__localOverride === true){
      config = mergeConfig(config, localOverride);
    }
    render();
    setPullStatus("Konten terbaru berhasil ditarik dari config.json.");
  }catch(err){
    try{
      const cached = JSON.parse(localStorage.getItem(REMOTE_CACHE_KEY) || "null");
      if(cached){
        config = mergeConfig(window.DEFAULT_CONFIG, cached);
        render();
        setPullStatus("Mode offline: memakai cache konten terakhir.");
      } else {
        setPullStatus("Gagal pull config. Memakai config bawaan.");
      }
    }catch(e){
      setPullStatus("Gagal pull config. Memakai config bawaan.");
    }
  }
}

async function pushConfigToGas(){
  const gasUrl = getGasApiUrl();
  if(!gasUrl){
    alert("Isi dulu Google Apps Script API URL.");
    return;
  }
  try{
    setPullStatus("Mengirim config ke Google Sheet...");
    const cleanConfig = {...config};
    delete cleanConfig.__localOverride;
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({action:"saveConfig", config: cleanConfig})
    });
    const payload = await res.json();
    if(!payload.ok) throw new Error(payload.error || "Gagal simpan");
    setPullStatus("Config berhasil dikirim ke Google Sheet.");
    alert("Berhasil push ke Google Sheet.");
  }catch(err){
    setPullStatus("Gagal push ke Google Sheet.");
    alert("Gagal push ke Google Sheet. Cek URL Web App dan permission Apps Script.");
  }
}$1(message){
  const el = document.getElementById("pullStatus");
  if(el) el.textContent = message || "";
}


function saveConfig(next){
  config = mergeConfig(window.DEFAULT_CONFIG, {...next, __localOverride: true});
  localStorage.setItem(KEY, JSON.stringify(config));
  render();
}

function safeLink(link){
  return link && link.trim() ? link.trim() : "#";
}

function getGasApiUrl(){
  return (localStorage.getItem(GAS_URL_KEY) || window.GAS_API_URL || "").trim();
}

function setGasApiUrl(url){
  localStorage.setItem(GAS_URL_KEY, (url || "").trim());
}

function render(){
  $("brandName").textContent = config.brandName;
  $("brandTagline").textContent = config.tagline;
  $("heroTitle").textContent = config.heroTitle;
  $("heroSubtitle").textContent = config.heroSubtitle;
  $("brandLogo").src = config.logo || "assets/logo-placeholder.svg";
  $("heroBanner").src = config.banner || "assets/banner-placeholder.svg";

  $("btnDaftar").href = safeLink(config.daftarLink);
  $("btnAdmin").href = safeLink(config.adminLink);
  $("navLogin").href = safeLink(config.loginLink);
  $("navAdmin").href = safeLink(config.adminLink);

  const vid = $("tutorialVideo");
  const src = vid.querySelector("source");
  if(config.video && config.video.trim()){
    src.src = config.video.trim();
    $("videoEmpty").style.display = "none";
    vid.style.display = "block";
    vid.load();
  } else {
    src.src = "";
    $("videoEmpty").style.display = "flex";
  }

  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
  renderGuide();
  renderFaq();
}

function renderGuide(){
  const content = $("guideContent");
  const labels = {
    daftar: "Cara Daftar",
    deposit: "Deposit QRIS",
    transfer: "Transfer Saldo ke Game",
    promo: "Info Promo"
  };
  const steps = config.guides[activeTab] || [];
  content.innerHTML = `
    <p class="eyebrow">${labels[activeTab]}</p>
    <ul class="step-list">
      ${steps.map((step, i) => `
        <li class="step-item">
          <div class="step-num">${i+1}</div>
          <div><strong>Langkah ${i+1}</strong><span>${escapeHtml(step)}</span></div>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderFaq(){
  $("faqList").innerHTML = (config.faq || []).map(([q,a]) => `
    <details class="faq-item">
      <summary>${escapeHtml(q)}</summary>
      <p>${escapeHtml(a)}</p>
    </details>
  `).join("");
}

function escapeHtml(text){
  return String(text || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    if(location.hash.replace("#","") !== activeTab) history.replaceState(null, "", `#${activeTab}`);
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderGuide();
  });
});

$("openSettings").addEventListener("click", () => {
  $("pinInput").value = "";
  $("pinError").textContent = "";
  $("pinAlertInfo").textContent = getPinAlertMessage();
  $("pinDialog").showModal();
});

$("submitPin").addEventListener("click", () => {
  if($("pinInput").value === config.pin){
    $("pinDialog").close();
    clearPinAttempts();
    fillSettings();
    $("settingsDialog").showModal();
  } else {
    recordFailedPinAttempt();
    $("pinError").textContent = "PIN salah. Akses ditolak.";
    $("pinAlertInfo").textContent = getPinAlertMessage();
  }
});

function recordFailedPinAttempt(){
  const attempts = JSON.parse(localStorage.getItem("slotGuideFailedPinAttempts") || "[]");
  attempts.push({time: new Date().toISOString()});
  localStorage.setItem("slotGuideFailedPinAttempts", JSON.stringify(attempts.slice(-20)));
}

function clearPinAttempts(){
  localStorage.removeItem("slotGuideFailedPinAttempts");
}

function getPinAlertMessage(){
  const attempts = JSON.parse(localStorage.getItem("slotGuideFailedPinAttempts") || "[]");
  if(!attempts.length) return "";
  const last = new Date(attempts[attempts.length - 1].time);
  return `Alert lokal: ada ${attempts.length} percobaan PIN salah di device ini. Terakhir: ${last.toLocaleString("id-ID")}.`;
}

function fillSettings(){
  $("setBrandName").value = config.brandName || "";
  $("setTagline").value = config.tagline || "";
  $("setHeroTitle").value = config.heroTitle || "";
  $("setHeroSubtitle").value = config.heroSubtitle || "";
  $("setDaftar").value = config.daftarLink || "";
  $("setLogin").value = config.loginLink || "";
  $("setAdmin").value = config.adminLink || "";
  $("setLogo").value = config.logo || "";
  $("setBanner").value = config.banner || "";
  $("setVideo").value = config.video || "";
  $("setGasApi").value = getGasApiUrl();
  $("setPin").value = "";
  $("setDaftarSteps").value = (config.guides.daftar || []).join("\n");
  $("setDepositSteps").value = (config.guides.deposit || []).join("\n");
  $("setTransferSteps").value = (config.guides.transfer || []).join("\n");
  $("setPromoSteps").value = (config.guides.promo || []).join("\n");
  $("setFaq").value = (config.faq || []).map(([q,a]) => `${q} | ${a}`).join("\n");
}

$("saveSettings").addEventListener("click", () => {
  const next = {
    ...config,
    brandName: $("setBrandName").value.trim(),
    tagline: $("setTagline").value.trim(),
    heroTitle: $("setHeroTitle").value.trim(),
    heroSubtitle: $("setHeroSubtitle").value.trim(),
    daftarLink: $("setDaftar").value.trim(),
    loginLink: $("setLogin").value.trim(),
    adminLink: $("setAdmin").value.trim(),
    logo: $("setLogo").value.trim() || "assets/logo-placeholder.svg",
    banner: $("setBanner").value.trim() || "assets/banner-placeholder.svg",
    video: $("setVideo").value.trim(),
    pin: $("setPin").value.trim() || config.pin,
    guides: {
      daftar: lines($("setDaftarSteps").value),
      deposit: lines($("setDepositSteps").value),
      transfer: lines($("setTransferSteps").value),
      promo: lines($("setPromoSteps").value)
    },
    faq: parseFaq($("setFaq").value)
  };
  setGasApiUrl($("setGasApi").value.trim());
  saveConfig(next);
  $("settingsDialog").close();
});

function lines(text){
  return text.split("\n").map(x => x.trim()).filter(Boolean);
}

function parseFaq(text){
  return text.split("\n").map(row => {
    const [q, ...rest] = row.split("|");
    return [q?.trim(), rest.join("|").trim()];
  }).filter(([q,a]) => q && a);
}

$("exportConfig").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "slot-guide-config.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("importConfig").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  try{
    const data = JSON.parse(await file.text());
    saveConfig(data);
    fillSettings();
    alert("Config berhasil diimport.");
  }catch(err){
    alert("File config tidak valid.");
  }
});

$("pullRemoteConfig")?.addEventListener("click", async () => {
  setGasApiUrl($("setGasApi")?.value?.trim() || getGasApiUrl());
  localStorage.removeItem(KEY);
  await pullRemoteConfig();
  fillSettings();
});

$("pushGasConfig")?.addEventListener("click", async () => {
  setGasApiUrl($("setGasApi")?.value?.trim() || getGasApiUrl());
  await pushConfigToGas();
});

$("resetSettings").addEventListener("click", () => {
  if(confirm("Reset setting lokal di device ini?")){
    localStorage.removeItem(KEY);
    config = loadConfig();
    render();
    $("settingsDialog").close();
  }
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

render();
pullRemoteConfig();

window.addEventListener("hashchange", () => {
  const next = (location.hash || "").replace("#", "");
  if(["daftar","deposit","transfer","promo"].includes(next)){
    activeTab = next;
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    render();
  }
});
