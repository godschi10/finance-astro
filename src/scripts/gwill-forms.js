/* gwill-forms port — WP assets/js/forms.js behaviour for the static port.
 * Attaches to every .gwill-form (newsletter partial + routed contact form),
 * POSTs FormData to the comments-api Worker (which replaces admin-ajax),
 * mirrors the loading state (aria-busy + data-loading + disabled), and on
 * success either redirects to the form's data-success-url or replaces the
 * form with the .gwill-form__success-msg node — exactly the live behaviour.
 * Error strings match the Worker's {success:false,data:{message}} envelope;
 * the fallbacks match forms.js F_I18N fallbacks verbatim. */
(() => {
  "use strict";
  const API = document.documentElement.getAttribute("data-forms-api") || "";
  if (!API) return;

  const setLoading = (form, submit, on) => {
    if (on) {
      form.setAttribute("aria-busy", "true");
      if (submit) { submit.setAttribute("data-loading", ""); submit.disabled = true; }
    } else {
      form.removeAttribute("aria-busy");
      if (submit) { submit.removeAttribute("data-loading"); submit.disabled = false; }
    }
  };

  document.querySelectorAll("form.gwill-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const submit = form.querySelector(".gwill-form__submit");
      const status = form.querySelector(".gwill-form__status");
      if (!status) return;
      status.textContent = "";
      status.className = "gwill-form__status";
      setLoading(form, submit, true);
      // Same two-step the live assets/js/forms.js uses: fetch a short-lived
      // nonce, then post it alongside the fields (here an HMAC hour token
      // from the Worker instead of WP's wp_create_nonce).
      fetch(API + "/forms/nonce")
        .then((r) => r.json())
        .then((d) => {
          const fd = new FormData(form); // gwill_form_id routes newsletter vs routed
          fd.append("gwill_nonce", (d && d.data) || "");
          return fetch(API + "/forms", { method: "POST", body: fd });
        })
        .then((r) => r.json().catch(() => null).then((d) => ({ ok: r.ok, d })))
        .then(({ d }) => {
          if (d && d.success) {
            const successUrl = form.getAttribute("data-success-url");
            if (successUrl) { window.location.href = successUrl; return; }
            const msg = document.createElement("p");
            msg.className = "gwill-form__success-msg";
            msg.setAttribute("role", "alert");
            msg.textContent = (d.data && d.data.message) || "Message sent!";
            form.replaceWith(msg);
          } else {
            const err = (d && d.data && d.data.message) || "Couldn't send that. Check your connection and try again.";
            status.textContent = err;
            status.classList.add("gwill-form__status--error");
            setLoading(form, submit, false);
          }
        })
        .catch((err) => {
          if (window.console && console.error) console.error("[GWill Forms] Submission failed:", err);
          const text = err && err instanceof SyntaxError
            ? "Unexpected response from the server. Please try again."
            : "Network error. Check your connection and try again.";
          status.textContent = text;
          status.classList.add("gwill-form__status--error");
          setLoading(form, submit, false);
        });
    });
  });
})();
