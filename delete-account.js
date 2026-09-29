const configuration = document.querySelector("[data-supabase-config]")?.dataset ?? {};
const form = document.querySelector("#delete-request-form");
const confirmationForm = document.querySelector("#delete-confirm-form");
const status = document.querySelector("#delete-request-status");
const confirmStep = document.querySelector("#delete-confirm-step");
const success = document.querySelector("#delete-complete");
const confirmInput = document.querySelector("#delete-confirm-text");
const confirmButton = confirmationForm?.querySelector("button[type=submit]");
let accessToken = "";

function message(text, tone = "") {
  status.textContent = text;
  status.dataset.tone = tone;
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function configured() {
  return /^https:\/\//.test(configuration.url ?? "") && (configuration.publishableKey ?? "").length > 20;
}

async function exchangeCode() {
  const code = new URL(location.href).searchParams.get("code");
  const verifier = sessionStorage.getItem("uskeep-delete-pkce");
  if (!code || !verifier || !configured()) return;
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
  sessionStorage.removeItem("uskeep-delete-pkce");
  const response = await fetch(`${configuration.url}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { apikey: configuration.publishableKey, "content-type": "application/json" },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.access_token !== "string" || !result.user) {
    message("That verification link could not be used. Request a new link or contact support.", "error");
    return;
  }
  accessToken = result.access_token;
  document.querySelector("#delete-account-identity").textContent = `Signed in as ${result.user.email ?? "your verified account"}. This action permanently deletes your Uskeep account.`;
  form.hidden = true;
  confirmStep.hidden = false;
  confirmInput.focus({ preventScroll: true });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#delete-email");
  const email = input.value.trim().toLowerCase();
  if (!input.checkValidity()) {
    input.reportValidity();
    return;
  }
  if (!configured()) {
    message("Secure deletion requests are not configured in this preview. Delete your account in the app or contact support.", "error");
    return;
  }
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  message("Sending a secure verification link…");
  try {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = base64Url(new Uint8Array(digest));
    sessionStorage.setItem("uskeep-delete-pkce", verifier);
    const redirect = new URL("/delete-account/", location.origin).href;
    await fetch(`${configuration.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, {
      method: "POST",
      headers: { apikey: configuration.publishableKey, "content-type": "application/json" },
      body: JSON.stringify({ email, create_user: false, code_challenge: challenge, code_challenge_method: "s256" }),
      cache: "no-store",
    });
    message("If the request was accepted for a Uskeep account, a secure verification link will arrive shortly. If you don’t receive one, try again later or contact support.", "success");
    input.value = "";
  } catch {
    sessionStorage.removeItem("uskeep-delete-pkce");
    message("If the request was accepted for a Uskeep account, a secure verification link will arrive shortly. If you don’t receive one, try again later or contact support.", "success");
  } finally {
    submit.disabled = false;
  }
});

confirmInput?.addEventListener("input", () => {
  confirmButton.disabled = confirmInput.value !== "DELETE";
});

confirmationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (confirmInput.value !== "DELETE" || !accessToken || !configured()) return;
  confirmButton.disabled = true;
  message("Deleting your account and associated data…");
  try {
    const response = await fetch(`${configuration.url}/functions/v1/delete-account`, {
      method: "POST",
      headers: { apikey: configuration.publishableKey, authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("deletion request failed");
    accessToken = "";
    confirmStep.hidden = true;
    success.hidden = false;
    message("");
  } catch {
    message("Deletion could not be completed. Your account has not been confirmed as deleted; please retry or contact support.", "error");
    confirmButton.disabled = false;
  }
});

void exchangeCode().catch(() => message("That verification link could not be used. Request a new link or contact support.", "error"));
