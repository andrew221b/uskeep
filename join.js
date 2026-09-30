// The invitation is a private capability. Never pass it to analytics or third-party requests.
const token = new URL(location.href).searchParams.get('invite');
const content = document.querySelector('#invite-content');
const status = document.querySelector('#invite-status');
const actions = document.querySelector('#invite-actions');
const openApp = document.querySelector('#open-app');
if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
  status.textContent = 'This link is incomplete. Ask your partner for a new invitation.';
} else {
  // Keep secrets out of the visible URL, subsequent referrers and browser history.
  history.replaceState(null, '', '/join/');
  openApp.href = `uskeep://invite?invite=${encodeURIComponent(token)}`;
  actions.hidden = false;
  const supabaseUrl = content.dataset.supabaseUrl;
  const key = content.dataset.supabaseKey;
  if (supabaseUrl && key) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 8000);
    fetch(`${supabaseUrl}/rest/v1/rpc/preview_pair_link`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_token: token }), signal: timeout.signal,
      credentials: 'omit', referrerPolicy: 'no-referrer',
    }).then(async (response) => {
      if (!response.ok) throw new Error('Unavailable');
      const invite = await response.json();
      if (!invite) {
        status.textContent = 'This invitation has expired or was already accepted. Ask your partner for a new link.';
        actions.hidden = true;
        return;
      }
      if (typeof invite.inviterName === 'string') document.querySelector('h1').textContent = `${invite.inviterName} invited you.`;
      status.textContent = 'One shared space. Your own Home.';
    }).catch(() => { status.textContent = 'Open Uskeep to check your invitation, or try this link again when you’re online.'; }).finally(() => clearTimeout(timer));
  }
}
