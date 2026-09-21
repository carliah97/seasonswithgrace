const C = window.SWG_LAUNCH_CONFIG || {};
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

menuBtn?.addEventListener("click",()=>{
  const open = mainNav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded",String(open));
});
mainNav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  mainNav.classList.remove("open");
  menuBtn.setAttribute("aria-expanded","false");
}));

function makeLeadId(){
  return "SWG-" + Date.now().toString(36).toUpperCase();
}

async function submitLead(payload){
  const endpoint = (C.leadEndpoint || document.getElementById("leadForm")?.action || "https://formspree.io/f/xljdepew").trim();
  if(!endpoint){
    throw new Error("The online quote form is not connected yet. Add your leadEndpoint in launch-config.js before running ads.");
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if(value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });

  let response;
  try{
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json"
      },
      body: formData
    });
  }catch(error){
    const fallback = await submitLeadViaFallback(endpoint, formData);
    if(!fallback.ok) throw new Error(fallback.message || "The quote request could not be sent.");
    return fallback.response;
  }

  if(!response.ok){
    let message = "The quote request could not be sent.";
    try{
      const body = await response.json();
      if(body?.errors?.[0]?.message) message = body.errors[0].message;
      if(body?.message) message = body.message;
    }catch(e){}
    throw new Error(message);
  }
  return response;
}

function submitLeadViaFallback(endpoint, formData){
  return new Promise((resolve) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = endpoint;
    form.style.display = "none";

    for (const [key, value] of formData.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onreadystatechange = function(){
      if(xhr.readyState !== 4) return;
      const ok = xhr.status >= 200 && xhr.status < 300;
      resolve({
        ok,
        message: ok ? "" : (xhr.responseText || "The quote request could not be sent."),
        response: { ok, status: xhr.status }
      });
      form.remove();
    };

    try {
      xhr.send(formData);
    }catch(err){
      form.remove();
      resolve({ ok: false, message: err.message || "The quote request could not be sent.", response: { ok: false } });
    }
  });
}

const leadForm = document.getElementById("leadForm");
leadForm?.addEventListener("submit",async e=>{
  e.preventDefault();

  const status = document.getElementById("leadStatus");
  const button = document.getElementById("leadSubmit");
  const data = Object.fromEntries(new FormData(leadForm).entries());

  data.leadId = makeLeadId();
  data.source = "SWG Website Quote";
  data.submittedAt = new Date().toISOString();
  data.pageUrl = location.href;
  Object.assign(data, window.SWGAttribution || {});

  status.className = "launch-form-status show";
  status.textContent = "Sending your quote request…";
  button.disabled = true;

  try{
    await submitLead(data);

    sessionStorage.setItem("swgLastLeadId",data.leadId);
    window.SWGAnalytics?.lead();

    status.className = "launch-form-status show ok";
    status.textContent = C.responseMessage || "Your quote request was received.";

    setTimeout(()=>{
      const qs = new URLSearchParams({
        lead:data.leadId,
        pet:data.petName || ""
      });
      location.href = "thank-you.html?" + qs.toString();
    },650);
  }catch(err){
    status.className = "launch-form-status show err";
    status.textContent = err.message + (C.phone ? " You can also call or text us." : "");
    button.disabled = false;
  }
});

const reviewForm = document.getElementById("reviewForm");
reviewForm?.addEventListener("submit",async e=>{
  e.preventDefault();

  const status = document.getElementById("reviewStatus");
  const button = document.getElementById("reviewSubmit");
  const data = Object.fromEntries(new FormData(reviewForm).entries());
  data.source = "SWG Website Review";
  data.submittedAt = new Date().toISOString();
  data.pageUrl = location.href;

  status.className = "launch-form-status show";
  status.textContent = "Sending your review…";
  button.disabled = true;

  try{
    await submitLead(data);
    status.className = "launch-form-status show ok";
    status.textContent = "Thank you. Your review was sent to Seasons With Grace for approval.";
    reviewForm.reset();
  }catch(err){
    status.className = "launch-form-status show err";
    status.textContent = err.message || "Your review could not be sent. Please try again.";
  }finally{
    button.disabled = false;
  }
});

const careerForm = document.getElementById("careerForm");
careerForm?.addEventListener("submit",async e=>{
  e.preventDefault();

  const status = document.getElementById("careerStatus");
  const button = document.getElementById("careerSubmit");
  const data = Object.fromEntries(new FormData(careerForm).entries());
  data.source = "SWG Driver Application";
  data.submittedAt = new Date().toISOString();
  data.pageUrl = location.href;

  status.className = "launch-form-status show";
  status.textContent = "Sending your application…";
  button.disabled = true;

  try{
    await submitLead(data);
    status.className = "launch-form-status show ok";
    status.textContent = "Thank you. Your driver application was sent for review.";
    careerForm.reset();
  }catch(err){
    status.className = "launch-form-status show err";
    status.textContent = err.message || "Your application could not be sent. Please try again.";
  }finally{
    button.disabled = false;
  }
});
