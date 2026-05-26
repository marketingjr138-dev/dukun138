const KEY = "slotGuidePwaConfigV1";
const REMOTE_CACHE_KEY = "slotGuideRemoteConfigCacheV1";
const ACTIVE_TAB_KEY = "slotGuideActiveTabV1";
const GAS_URL_KEY = "slotGuideGasApiUrlV1";
const allowedTabs = ["daftar", "deposit", "transfer", "withdraw", "promo"];
const $ = (id) => document.getElementById(id);

let config = loadConfig();
let activeTab = getInitialTab();

function loadConfig(){
  try{
    const local = JSON.parse(localStorage.getItem(KEY) || "null");
    return mergeConfig(window.DEFAULT_CONFIG || {}, local || {});
  }catch(e){
    return window.DEFAULT_CONFIG || {};
  }
}

function mergeConfig(base, incoming){
  incoming = incoming || {};
  return {
    ...base,
    ...incoming,
    guides: {...(base.guides || {}), ...(incoming.guides || {})},
    media: {...(base.media || {}), ...(incoming.media || {})},
    faq: incoming.faq || base.faq || []
  };
}

function getInitialTab(){
  const hash = (location.hash || "").replace("#", "");
  if(allowedTabs.includes(hash)) return hash;
  const saved = localStorage.getItem(ACTIVE_TAB_KEY);
  return allowedTabs.includes(saved) ? saved : "daftar";
}

function safeLink(link){
  return link && String(link).trim() ? String(link).trim() : "#";
}

function getGasApiUrl(){
  return (localStorage.getItem(GAS_URL_KEY) || window.GAS_API_URL || "").trim();
}

function setGasApiUrl(url){
  localStorage.setItem(GAS_URL_KEY, (url || "").trim());
}

function setPullStatus(message){
  const el = $("pullStatus");
  if(el) el.textContent = message || "";
}

function saveConfig(next){
  config = mergeConfig(window.DEFAULT_CONFIG || {}, {...next, __localOverride: true});
  localStorage.setItem(KEY, JSON.stringify(config));
  render();
}

async function pullRemoteConfig(){
  if(!window.AUTO_PULL_CONFIG) return;
  const gasUrl = getGasApiUrl();
  const source = window.CONFIG_SOURCE || "auto";

  if(gasUrl && (source === "auto" || source === "gas")){
    try{
      const res = await fetch(`${gasUrl}?action=getConfig&v=${Date.now()}`, {cache:"no-store"});
      if(!res.ok) throw new Error("GAS fetch failed");
      const payload = await res.json();
      if(payload && payload.ok === false) throw new Error(payload.error || "GAS payload error");
      applyRemoteConfig(payload.config || payload);
      setPullStatus("Konten terbaru berhasil ditarik dari Google Sheet.");
      return;
    }catch(err){
      setPullStatus("Gagal pull Google Sheet. Mencoba fallback config.json...");
      if(source === "gas") return;
    }
  }

  if(!window.CONFIG_URL) return;
  try{
    const res = await fetch(`${window.CONFIG_URL}?v=${Date.now()}`, {cache:"no-store"});
    if(!res.ok) throw new Error("Config fetch failed");
    const remote = await res.json();
    applyRemoteConfig(remote);
    setPullStatus("Konten terbaru berhasil ditarik dari config.json.");
  }catch(err){
    try{
      const cached = JSON.parse(localStorage.getItem(REMOTE_CACHE_KEY) || "null");
      if(cached){
        config = mergeConfig(window.DEFAULT_CONFIG || {}, cached);
        render();
        setPullStatus("Mode offline: memakai cache konten terakhir.");
      }
    }catch(e){}
  }
}

function applyRemoteConfig(remote){
  localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(remote));
  const localOverride = JSON.parse(localStorage.getItem(KEY) || "null");
  config = mergeConfig(window.DEFAULT_CONFIG || {}, remote);
  if(localOverride && localOverride.__localOverride === true){
    config = mergeConfig(config, localOverride);
  }
  render();
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
}

function render(){
  setText("brandName", config.brandName || "DUKUN138 GUIDE");
  setText("brandTagline", config.tagline || "");
  setText("heroTitle", config.heroTitle || "");
  setText("heroSubtitle", config.heroSubtitle || "");

  setSrc("brandLogo", config.logo || "assets/logo-placeholder.svg");
  setSrc("heroBanner", config.banner || "assets/banner-placeholder.svg");

  setHref("btnDaftar", config.daftarLink);
  setHref("btnLogin", config.loginLink);
  setHref("btnAdmin", config.adminLink);
  setHref("btnAdminBottom", config.adminLink);

  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
  document.querySelectorAll("[data-nav-tab]").forEach(b => b.classList.toggle("active", b.dataset.navTab === activeTab));

  renderGuide();
  renderMedia();
  renderFaq();
}

function setText(id, val){
  const el = $(id);
  if(el) el.textContent = val || "";
}

function setSrc(id, val){
  const el = $(id);
  if(el) el.src = val || "";
}

function setHref(id, val){
  const el = $(id);
  if(el) el.href = safeLink(val);
}

function renderGuide(){
  const labels = {
    daftar:"Cara Daftar", deposit:"Deposit QRIS", transfer:"Transfer Saldo ke Game",
    withdraw:"Cara Withdraw", promo:"Info Promo"
  };
  const desc = {
    daftar:"Ikuti langkah pendaftaran akun dari awal sampai bisa login.",
    deposit:"Panduan deposit memakai QRIS atau metode pembayaran yang tersedia.",
    transfer:"Cara memindahkan saldo utama ke provider/game tujuan.",
    withdraw:"Cara tarik saldo dari akun utama ke rekening/e-wallet tujuan.",
    promo:"Info singkat sebelum klaim bonus atau promo aktif."
  };
  const steps = (config.guides && config.guides[activeTab]) || [];
  const el = $("guideContent");
  if(!el) return;
  el.innerHTML = `
    <p class="eyebrow">${labels[activeTab] || "Panduan"}</p>
    <h3>${labels[activeTab] || "Panduan"}</h3>
    <p class="muted">${desc[activeTab] || ""}</p>
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

function renderMedia(){
  const labels = {daftar:"Tutorial Daftar",deposit:"Tutorial Deposit QRIS",transfer:"Tutorial Transfer Saldo Game",withdraw:"Tutorial Withdraw",promo:"Tutorial Promo"};
  setText("mediaTitle", `${labels[activeTab] || "Tutorial"} format HP`);

  const media = (config.media && config.media[activeTab]) || {};
  const img = $("tutorialImage");
  const imageEmpty = $("imageEmpty");
  if(img && imageEmpty){
    if(media.image && media.image.trim()){
      img.src = media.image.trim();
      img.style.display = "block";
      imageEmpty.style.display = "none";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
      imageEmpty.style.display = "flex";
    }
  }

  const vid = $("tutorialVideo");
  const videoEmpty = $("videoEmpty");
  if(vid && videoEmpty){
    const source = vid.querySelector("source");
    if(media.video && media.video.trim()){
      source.src = media.video.trim();
      videoEmpty.style.display = "none";
      vid.style.display = "block";
      vid.load();
    } else {
      source.src = "";
      vid.style.display = "block";
      videoEmpty.style.display = "flex";
      vid.load();
    }
  }
}

function renderFaq(){
  const el = $("faqList");
  if(!el) return;
  el.innerHTML = (config.faq || []).map(([q,a]) => `
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

function setActiveTab(tab){
  if(!allowedTabs.includes(tab)) tab = "daftar";
  activeTab = tab;
  localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  if(location.hash.replace("#","") !== activeTab) history.replaceState(null, "", `#${activeTab}`);
  render();
}

function openAdminPin(){
  const pin = $("pinInput");
  const err = $("pinError");
  const alertInfo = $("pinAlertInfo");
  if(pin) pin.value = "";
  if(err) err.textContent = "";
  if(alertInfo) alertInfo.textContent = getPinAlertMessage();
  const dialog = $("pinDialog");
  if(dialog && typeof dialog.showModal === "function") dialog.showModal();
  else alert("Browser tidak mendukung dialog. PIN admin default: " + (config.pin || "7788"));
}

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
  setValue("setBrandName", config.brandName);
  setValue("setTagline", config.tagline);
  setValue("setHeroTitle", config.heroTitle);
  setValue("setHeroSubtitle", config.heroSubtitle);
  setValue("setDaftar", config.daftarLink);
  setValue("setLogin", config.loginLink);
  setValue("setAdmin", config.adminLink);
  setValue("setLogo", config.logo);
  setValue("setBanner", config.banner);
  setValue("setGasApi", getGasApiUrl());
  setValue("setPin", "");

  setValue("setDaftarSteps", ((config.guides || {}).daftar || []).join("\n"));
  setValue("setDepositSteps", ((config.guides || {}).deposit || []).join("\n"));
  setValue("setTransferSteps", ((config.guides || {}).transfer || []).join("\n"));
  setValue("setWithdrawSteps", ((config.guides || {}).withdraw || []).join("\n"));
  setValue("setPromoSteps", ((config.guides || {}).promo || []).join("\n"));
  setValue("setFaq", (config.faq || []).map(([q,a]) => `${q} | ${a}`).join("\n"));

  const m = config.media || {};
  setValue("setImgDaftar", m.daftar?.image || "");
  setValue("setVidDaftar", m.daftar?.video || "");
  setValue("setImgDeposit", m.deposit?.image || "");
  setValue("setVidDeposit", m.deposit?.video || "");
  setValue("setImgTransfer", m.transfer?.image || "");
  setValue("setVidTransfer", m.transfer?.video || "");
  setValue("setImgWithdraw", m.withdraw?.image || "");
  setValue("setVidWithdraw", m.withdraw?.video || "");
  setValue("setImgPromo", m.promo?.image || "");
  setValue("setVidPromo", m.promo?.video || "");
}

function setValue(id, val){
  const el = $(id);
  if(el) el.value = val || "";
}

function lines(text){
  return String(text || "").split("\n").map(x => x.trim()).filter(Boolean);
}

function parseFaq(text){
  return String(text || "").split("\n").map(row => {
    const [q, ...rest] = row.split("|");
    return [q?.trim(), rest.join("|").trim()];
  }).filter(([q,a]) => q && a);
}

function collectSettings(){
  return {
    ...config,
    brandName: $("setBrandName")?.value.trim() || "",
    tagline: $("setTagline")?.value.trim() || "",
    heroTitle: $("setHeroTitle")?.value.trim() || "",
    heroSubtitle: $("setHeroSubtitle")?.value.trim() || "",
    daftarLink: $("setDaftar")?.value.trim() || "",
    loginLink: $("setLogin")?.value.trim() || "",
    adminLink: $("setAdmin")?.value.trim() || "",
    logo: $("setLogo")?.value.trim() || "assets/logo-placeholder.svg",
    banner: $("setBanner")?.value.trim() || "assets/banner-placeholder.svg",
    pin: $("setPin")?.value.trim() || config.pin,
    guides: {
      daftar: lines($("setDaftarSteps")?.value),
      deposit: lines($("setDepositSteps")?.value),
      transfer: lines($("setTransferSteps")?.value),
      withdraw: lines($("setWithdrawSteps")?.value),
      promo: lines($("setPromoSteps")?.value)
    },
    media: {
      daftar: { image: $("setImgDaftar")?.value.trim() || "", video: $("setVidDaftar")?.value.trim() || "" },
      deposit: { image: $("setImgDeposit")?.value.trim() || "", video: $("setVidDeposit")?.value.trim() || "" },
      transfer: { image: $("setImgTransfer")?.value.trim() || "", video: $("setVidTransfer")?.value.trim() || "" },
      withdraw: { image: $("setImgWithdraw")?.value.trim() || "", video: $("setVidWithdraw")?.value.trim() || "" },
      promo: { image: $("setImgPromo")?.value.trim() || "", video: $("setVidPromo")?.value.trim() || "" }
    },
    faq: parseFaq($("setFaq")?.value)
  };
}

function bindEvents(){
  document.addEventListener("click", (e) => {
    const adminBtn = e.target.closest("[data-open-admin]");
    if(adminBtn){
      e.preventDefault();
      openAdminPin();
      return;
    }

    const navTab = e.target.closest("[data-nav-tab]");
    if(navTab){
      e.preventDefault();
      setActiveTab(navTab.dataset.navTab);
      document.querySelector(".guide-section")?.scrollIntoView({behavior:"smooth", block:"start"});
      return;
    }

    const homeBtn = e.target.closest('[data-nav="home"]');
    if(homeBtn){
      e.preventDefault();
      history.replaceState(null, "", "#app");
      window.scrollTo({top:0, behavior:"smooth"});
      return;
    }
  });

  $("submitPin")?.addEventListener("click", () => {
    if($("pinInput")?.value === config.pin){
      $("pinDialog")?.close();
      clearPinAttempts();
      fillSettings();
      $("settingsDialog")?.showModal();
    } else {
      recordFailedPinAttempt();
      setText("pinError", "PIN salah. Akses ditolak.");
      setText("pinAlertInfo", getPinAlertMessage());
    }
  });

  $("saveSettings")?.addEventListener("click", () => {
    setGasApiUrl($("setGasApi")?.value.trim() || getGasApiUrl());
    saveConfig(collectSettings());
    $("settingsDialog")?.close();
  });

  $("pullRemoteConfig")?.addEventListener("click", async () => {
    setGasApiUrl($("setGasApi")?.value.trim() || getGasApiUrl());
    localStorage.removeItem(KEY);
    await pullRemoteConfig();
    fillSettings();
  });

  $("pushGasConfig")?.addEventListener("click", async () => {
    setGasApiUrl($("setGasApi")?.value.trim() || getGasApiUrl());
    await pushConfigToGas();
  });

  $("resetSettings")?.addEventListener("click", () => {
    if(confirm("Reset setting lokal di device ini?")){
      localStorage.removeItem(KEY);
      config = loadConfig();
      render();
      $("settingsDialog")?.close();
    }
  });

  $("exportConfig")?.addEventListener("click", () => {
    const clean = {...config};
    delete clean.__localOverride;
    const blob = new Blob([JSON.stringify(clean, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dukun138-guide-config-v1.5.2.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("importConfig")?.addEventListener("change", async (e) => {
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

  window.addEventListener("hashchange", () => {
    const next = (location.hash || "").replace("#", "");
    if(allowedTabs.includes(next)){
      activeTab = next;
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
      render();
    }
  });
}

function preventZoom(){
  document.body.classList.add("no-zoom");
  let lastTouchEnd = 0;
  document.addEventListener("touchstart", e => { if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
  document.addEventListener("touchmove", e => { if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
  document.addEventListener("touchend", e => {
    const now = Date.now();
    if(now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, {passive:false});
  document.addEventListener("gesturestart", e => e.preventDefault());
}

function start(){
  bindEvents();
  preventZoom();
  render();
  pullRemoteConfig();
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
