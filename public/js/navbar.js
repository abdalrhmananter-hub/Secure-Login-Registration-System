// ─────────────────────────────────────────────────────────────
//  public/js/navbar.js
//  Runs on EVERY page.
//  Calls /api/session to find out whether the user is logged in,
//  then shows or hides nav links accordingly.
// ─────────────────────────────────────────────────────────────

/**
 * updateNavbar()
 * Fetches the current session state from our Express API endpoint
 * and toggles the visibility of nav items based on login status.
 */
async function updateNavbar() {
  try {
    // Fetch session info from our own server (no external API, no CORS issues)
    const res  = await fetch('/api/session');
    const data = await res.json();

    // Grab nav link elements by their data-auth attribute
    // data-auth="guest"  → visible when NOT logged in
    // data-auth="user"   → visible when logged in
    const guestLinks = document.querySelectorAll('[data-auth="guest"]');
    const userLinks  = document.querySelectorAll('[data-auth="user"]');

    if (data.loggedIn) {
      // ── Logged in: show user links, hide guest links ──────────
      guestLinks.forEach(el => el.classList.add('nav-hidden'));
      userLinks.forEach(el  => el.classList.remove('nav-hidden'));

      // If there's a username placeholder on the page, fill it in
      const userPlaceholder = document.getElementById('nav-username');
      if (userPlaceholder) userPlaceholder.textContent = data.username;

    } else {
      // ── Not logged in: show guest links, hide user links ──────
      guestLinks.forEach(el => el.classList.remove('nav-hidden'));
      userLinks.forEach(el  => el.classList.add('nav-hidden'));
    }

  } catch (err) {
    // If the request fails just log it – the nav can stay in its default state
    console.error('Could not fetch session:', err);
  }
}

// Run as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', updateNavbar);
