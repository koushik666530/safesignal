// script.js - SafeSignal functionality
(function () {
  // Elements
  const panicBtn = document.getElementById('panicBtn');
  const fakeCallBtn = document.getElementById('fakeCallBtn');
  const statusEl = document.getElementById('status');
  const sirenAudio = document.getElementById('siren');
  const callAudio = document.getElementById('callSound');

  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareSms = document.getElementById('shareSms');
  const shareMail = document.getElementById('shareMail');

  const contactForm = document.getElementById('contactForm');
  const contactName = document.getElementById('contactName');
  const contactPhone = document.getElementById('contactPhone');
  const contactEmail = document.getElementById('contactEmail');
  const contactsList = document.getElementById('contactsList');

  // localStorage key
  const KEY = 'safesignal_contacts_v1';

  function setStatus(msg, transient = false) {
    statusEl.textContent = msg || '';
    if (transient) {
      setTimeout(() => {
        if (statusEl.textContent === msg) statusEl.textContent = '';
      }, 3500);
    }
  }

  // Contacts management
  function loadContacts() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveContacts(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
    renderContacts();
  }

  function renderContacts() {
    const list = loadContacts();
    contactsList.innerHTML = '';
    if (!list.length) {
      const el = document.createElement('li');
      el.textContent = 'No trusted contacts yet. Add someone above.';
      el.style.color = '#98a0b3';
      contactsList.appendChild(el);
      return;
    }

    list.forEach((c, idx) => {
      const li = document.createElement('li');

      const meta = document.createElement('div');
      meta.className = 'meta';
      const name = document.createElement('strong');
      name.textContent = c.name || '(no name)';
      const info = document.createElement('span');
      info.textContent = [c.phone || '', c.email || ''].filter(Boolean).join(' • ');
      info.style.color = '#98a0b3';
      meta.appendChild(name);
      meta.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'contact-actions';

      const remove = document.createElement('button');
      remove.className = 'btn small';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        const newList = loadContacts();
        newList.splice(idx, 1);
        saveContacts(newList);
        setStatus('Contact removed', true);
      });

      // quick send buttons (email / sms) per contact
      if (c.phone) {
        const smsBtn = document.createElement('button');
        smsBtn.className = 'btn small';
        smsBtn.textContent = 'SMS';
        smsBtn.addEventListener('click', () => sendSmsToContact(c));
        actions.appendChild(smsBtn);
      }
      if (c.email) {
        const mailBtn = document.createElement('button');
        mailBtn.className = 'btn small';
        mailBtn.textContent = 'Email';
        mailBtn.addEventListener('click', () => sendMailToContact(c));
        actions.appendChild(mailBtn);
      }

      actions.appendChild(remove);
      li.appendChild(meta);
      li.appendChild(actions);
      contactsList.appendChild(li);
    });
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactName.value.trim();
    const phone = contactPhone.value.trim();
    const email = contactEmail.value.trim();
    if (!name) {
      setStatus('Please provide a name', true);
      return;
    }
    const list = loadContacts();
    list.push({ name, phone, email });
    saveContacts(list);
    contactName.value = contactPhone.value = contactEmail.value = '';
    setStatus('Contact added', true);
  });

  // Geolocation + message generation
  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  function buildLocationLink(lat, lon) {
    // Google maps link — universal
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }

  function encodeBody(text) {
    return encodeURIComponent(text);
  }

  // send helpers that open links — they rely on the user's device to handle them
  async function prepareAndOpenShare({ provider = 'email', specificContact = null } = {}) {
    setStatus('Getting current location...');
    try {
      const { lat, lon } = await getLocation();
      const mapsLink = buildLocationLink(lat, lon);
      const now = new Date().toLocaleString();
      const message = `EMERGENCY! I need help.\nName: ${getUserLabel()}\nTime: ${now}\nLocation: ${mapsLink}\nCoordinates: ${lat}, ${lon}`;
      const subject = 'EMERGENCY ALERT — Help needed';

      if (specificContact) {
        openForContact(provider, specificContact, subject, message);
      } else {
        // open generic share — provider handled below
        openShare(provider, subject, message);
      }

      setStatus('Prepared message — your sharing app should open now', true);
      // play siren briefly
      try { sirenAudio.currentTime = 0; sirenAudio.play(); setTimeout(()=>sirenAudio.pause(), 6000); } catch (e) {}
    } catch (err) {
      setStatus('Could not get location. Make sure location permission is allowed.', true);
      console.error(err);
      try { sirenAudio.pause(); } catch(e){}
    }
  }

  function getUserLabel() {
    // optional: could add user profile later; for now blank
    return '';
  }

  function openShare(provider, subject, message) {
    if (provider === 'whatsapp') {
      const shareUrl = `https://api.whatsapp.com/send?text=${encodeBody(message)}`;
      window.open(shareUrl, '_blank');
      return;
    }
    if (provider === 'sms') {
      // sms link - note: desktop behaviour varies
      const smsUrl = `sms:?&body=${encodeBody(message)}`;
      window.location.href = smsUrl;
      return;
    }
    // default email
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeBody(message)}`;
    window.location.href = mailto;
  }

  function openForContact(provider, contact, subject, message) {
    if (!contact) return;
    if (provider === 'whatsapp') {
      let url = `https://api.whatsapp.com/send?text=${encodeBody(message)}`;
      // WhatsApp to specific number requires format and may not work in all regions; skip number safe handling.
      window.open(url, '_blank');
      return;
    }
    if (provider === 'sms' && contact.phone) {
      // sms to a number
      const smsUrl = `sms:${encodeURIComponent(contact.phone)}?&body=${encodeBody(message)}`;
      window.location.href = smsUrl;
      return;
    }
    if (contact.email) {
      const mailto = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeBody(message)}`;
      window.location.href = mailto;
      return;
    }
    // fallback: open generic provider
    openShare(provider, subject, message);
  }

  // contact-specific quick send
  async function sendSmsToContact(contact) {
    if (!contact.phone) { setStatus('No phone for this contact', true); return; }
    setStatus('Getting location and opening SMS...');
    try {
      const { lat, lon } = await getLocation();
      const link = buildLocationLink(lat, lon);
      const msg = `EMERGENCY! ${link} (${lat},${lon})`;
      window.location.href = `sms:${encodeURIComponent(contact.phone)}?&body=${encodeURIComponent(msg)}`;
    } catch (err) {
      setStatus('Unable to access location', true);
    }
  }
  async function sendMailToContact(contact) {
    if (!contact.email) { setStatus('No email for this contact', true); return; }
    setStatus('Getting location and opening Email...');
    try {
      const { lat, lon } = await getLocation();
      const link = buildLocationLink(lat, lon);
      const subject = 'EMERGENCY ALERT';
      const msg = `EMERGENCY! I need help.\nLocation: ${link}\nCoordinates: ${lat},${lon}`;
      window.location.href = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
    } catch (err) {
      setStatus('Unable to access location', true);
    }
  }

  // top-level button handlers
  panicBtn.addEventListener('click', async () => {
    // Prepare alert and open share UI (default email)
    await prepareAndOpenShare({ provider: 'email' });
    // Also attempt to open sms and whatsapp in sequence as user convenience
    // NOTE: opening multiple may be blocked by popups — better to let user choose
  });

  shareWhatsApp.addEventListener('click', async () => {
    await prepareAndOpenShare({ provider: 'whatsapp' });
  });
  shareSms.addEventListener('click', async () => {
    await prepareAndOpenShare({ provider: 'sms' });
  });
  shareMail.addEventListener('click', async () => {
    await prepareAndOpenShare({ provider: 'email' });
  });

  fakeCallBtn.addEventListener('click', () => {
    try {
      callAudio.currentTime = 0;
      callAudio.play();
      setStatus('Fake call started — press again to stop', true);
      // toggle: if playing, stop on second press
      fakeCallBtn.textContent = 'Stop Fake Call';
      const stopFn = () => {
        callAudio.pause();
        callAudio.currentTime = 0;
        fakeCallBtn.textContent = 'Start Fake Call';
        setStatus('', false);
        fakeCallBtn.removeEventListener('click', stopFn);
      };
      fakeCallBtn.addEventListener('click', stopFn);
    } catch (e) {
      setStatus('Cannot play call audio on this device', true);
    }
  });

  // on load
  renderContacts();

  // Helpful: keyboard accessibility
  document.addEventListener('keyup', (e) => {
    // quick key: "A" to trigger alert (only when not typing)
    if (e.key.toLowerCase() === 'a' && !/input|textarea/i.test(document.activeElement.tagName)) {
      panicBtn.focus();
      panicBtn.click();
    }
  });

  // Expose for console testing (optional)
  window.safesignal = {
    getLocation,
    loadContacts,
    saveContacts,
    prepareAndOpenShare
  };
})();
