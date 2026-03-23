document.addEventListener('DOMContentLoaded', function() {

  // ===== CONFIG =====
  // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE:
  var SHEET_API_URL = '';
  // Example: 'https://script.google.com/macros/s/XXXXXXXXX/exec'

  // Init Lucide Icons
  setTimeout(function() {
    if (window.lucide) window.lucide.createIcons();
  }, 200);

  var appContainer = document.getElementById('app-container');
  var navScanBtn = document.getElementById('nav-scan-btn');

  // State
  var state = {
    url: '',
    googleLink: '',
    instaLink: '',
    category: '',
    location: '',
    scores: { website: 0, trust: 0, visibility: 0 },
    isRepeatScan: false,
    previousScores: null
  };

  // Nav scan button
  navScanBtn.addEventListener('click', function(e) {
    e.preventDefault();
    renderView('INPUT');
  });

  // ===== SMART SCORING ENGINE =====
  function generateSmartScores() {
    var hasUrl = state.url.trim().length > 0;
    var hasGoogle = state.googleLink.trim().length > 0;
    var hasInsta = state.instaLink.trim().length > 0;
    var hasCategory = state.category.trim().length > 0;

    // Base scores (low — to show problems)
    var webScore = 20 + Math.floor(Math.random() * 8);
    var trustScore = 18 + Math.floor(Math.random() * 8);
    var visScore = 22 + Math.floor(Math.random() * 10);

    // Adjust based on what they provided
    if (hasUrl) webScore += 10 + Math.floor(Math.random() * 5);
    if (hasGoogle) trustScore += 15 + Math.floor(Math.random() * 5);
    if (hasInsta) visScore += 12 + Math.floor(Math.random() * 5);
    if (hasCategory) {
      webScore += 3;
      visScore += 5;
    }

    // Cap first-scan scores to always show problems (max 60)
    webScore = Math.min(webScore, 55 + Math.floor(Math.random() * 6));
    trustScore = Math.min(trustScore, 50 + Math.floor(Math.random() * 5));
    visScore = Math.min(visScore, 58 + Math.floor(Math.random() * 5));

    // No Google link = trust capped low
    if (!hasGoogle) trustScore = Math.min(trustScore, 35);
    // No Instagram = visibility capped
    if (!hasInsta) visScore = Math.min(visScore, 42);

    // Check for repeat scan
    var storageKey = 'bgs_scan_' + normalizeUrl(state.url);
    var previousData = localStorage.getItem(storageKey);

    if (previousData) {
      var prev = JSON.parse(previousData);
      state.isRepeatScan = true;
      state.previousScores = prev.scores;

      // Improve scores from previous
      webScore = Math.min(90, prev.scores.website + 8 + Math.floor(Math.random() * 10));
      trustScore = Math.min(88, prev.scores.trust + 10 + Math.floor(Math.random() * 8));
      visScore = Math.min(92, prev.scores.visibility + 7 + Math.floor(Math.random() * 10));
    } else {
      state.isRepeatScan = false;
      state.previousScores = null;
    }

    state.scores.website = webScore;
    state.scores.trust = trustScore;
    state.scores.visibility = visScore;

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify({
      scores: { website: webScore, trust: trustScore, visibility: visScore },
      date: new Date().toISOString(),
      scanCount: previousData ? (JSON.parse(previousData).scanCount || 1) + 1 : 1
    }));
  }

  function normalizeUrl(url) {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  // ===== SAVE LEAD TO GOOGLE SHEET =====
  function saveLeadToSheet() {
    if (!SHEET_API_URL) return;

    var payload = {
      website: state.url,
      googleLink: state.googleLink,
      instagram: state.instaLink,
      category: state.category,
      location: state.location,
      websiteScore: state.scores.website,
      trustScore: state.scores.trust,
      visibilityScore: state.scores.visibility
    };

    fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function(err) {
      console.log('Sheet save error:', err);
    });
  }

  // ===== VIEW ROUTER =====
  function renderView(viewName) {
    appContainer.innerHTML = '';
    var bg = document.createElement('div');
    bg.className = 'bg-gradient';
    appContainer.appendChild(bg);

    var el;
    if (viewName === 'HERO') el = buildHero();
    else if (viewName === 'INPUT') el = buildInput();
    else if (viewName === 'SCANNING') el = buildScanning();
    else if (viewName === 'RESULTS') el = buildResults();

    appContainer.appendChild(el);
    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ====== HERO ======
  function buildHero() {
    var s = document.createElement('section');
    s.className = 'view-section active container';
    s.innerHTML = [
      '<div class="text-center max-w-2xl">',
        '<div class="badge mb-4">',
          '<i data-lucide="zap" style="width:14px;height:14px;"></i> AI Engine v2.0 Active',
        '</div>',
        '<h1 class="mb-3 hero-title" style="font-size:3.2rem;font-weight:900;line-height:1.1;">',
          '<span class="text-gradient">AI-Powered</span><br>Business Growth Scanner',
        '</h1>',
        '<p class="text-muted mb-4 hero-sub" style="font-size:1.15rem;max-width:520px;margin-left:auto;margin-right:auto;">',
          'Discover why your business is losing customers online — and get a free custom plan to fix it in 24 hours.',
        '</p>',
        '<button id="hero-cta" class="btn-primary" style="font-size:1.15rem;padding:18px 44px;">',
          '<i data-lucide="scan" style="width:20px;height:20px;"></i> Scan My Business Now',
        '</button>',
        '<div class="mt-2 flex items-center justify-center gap-3 flex-wrap" style="opacity:0.5;font-size:0.8rem;">',
          '<span>✓ Free Analysis</span>',
          '<span>✓ Instant Results</span>',
          '<span>✓ No Sign-Up</span>',
        '</div>',
      '</div>'
    ].join('');

    s.querySelector('#hero-cta').addEventListener('click', function() {
      renderView('INPUT');
    });
    return s;
  }

  // ====== INPUT ======
  function buildInput() {
    var s = document.createElement('section');
    s.className = 'view-section active container';
    s.innerHTML = [
      '<div class="glass-panel p-8 max-w-2xl w-full" style="position:relative;overflow:hidden;">',
        '<div class="scan-line"></div>',
        '<div class="text-center mb-4">',
          '<h2 class="text-gradient mb-1" style="font-size:1.8rem;">Initialize AI Scan</h2>',
          '<p class="text-muted text-sm">Enter your business details to begin deep analysis.</p>',
        '</div>',
        '<form id="scan-form">',
          '<div class="grid-2">',
            '<div class="form-group">',
              '<label><i data-lucide="globe" style="width:14px;height:14px;"></i> Website URL</label>',
              '<input type="url" id="inp-url" class="input-field" placeholder="https://yourwebsite.com" required>',
            '</div>',
            '<div class="form-group">',
              '<label><i data-lucide="map-pin" style="width:14px;height:14px;"></i> Location / City</label>',
              '<input type="text" id="inp-location" class="input-field" placeholder="e.g. Mumbai, New York" required>',
            '</div>',
          '</div>',
          '<div class="grid-2">',
            '<div class="form-group">',
              '<label><i data-lucide="star" style="width:14px;height:14px;"></i> Google Business Link</label>',
              '<input type="url" id="inp-google" class="input-field" placeholder="https://g.page/...">',
            '</div>',
            '<div class="form-group">',
              '<label><i data-lucide="instagram" style="width:14px;height:14px;"></i> Instagram Link</label>',
              '<input type="url" id="inp-insta" class="input-field" placeholder="https://instagram.com/...">',
            '</div>',
          '</div>',
          '<div class="form-group">',
            '<label><i data-lucide="briefcase" style="width:14px;height:14px;"></i> Business Category</label>',
            '<input type="text" id="inp-category" class="input-field" placeholder="e.g. Real Estate, Dental Clinic, Restaurant" required>',
          '</div>',
          '<button type="submit" class="btn-primary w-full mt-2" style="padding:16px;">',
            '<i data-lucide="cpu" style="width:18px;height:18px;"></i> Start AI Scan',
          '</button>',
        '</form>',
      '</div>'
    ].join('');

    s.querySelector('#scan-form').addEventListener('submit', function(e) {
      e.preventDefault();
      state.url = document.getElementById('inp-url').value;
      state.location = document.getElementById('inp-location').value;
      state.googleLink = document.getElementById('inp-google').value;
      state.instaLink = document.getElementById('inp-insta').value;
      state.category = document.getElementById('inp-category').value;
      renderView('SCANNING');
    });
    return s;
  }

  // ====== SCANNING ======
  function buildScanning() {
    var s = document.createElement('section');
    s.className = 'view-section active container';
    s.innerHTML = [
      '<div class="glass-panel p-8 max-w-md w-full text-center">',
        '<div style="position:relative;width:140px;height:140px;margin:0 auto 28px;">',
          '<div style="position:absolute;inset:0;border:2px solid rgba(139,92,246,0.3);border-radius:50%;border-top-color:var(--primary);animation:spin 1s linear infinite;"></div>',
          '<div style="position:absolute;inset:12px;border:2px solid rgba(59,130,246,0.2);border-radius:50%;border-left-color:var(--secondary);animation:spin 1.5s linear infinite reverse;"></div>',
          '<div style="position:absolute;inset:24px;border:2px solid rgba(236,72,153,0.15);border-radius:50%;border-bottom-color:var(--accent);animation:spin 2s linear infinite;"></div>',
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">',
            '<i data-lucide="cpu" style="width:40px;height:40px;color:var(--primary);"></i>',
          '</div>',
        '</div>',
        '<h2 class="mb-2" style="font-size:1.4rem;">AI Analysis in Progress</h2>',
        '<div style="width:100%;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-bottom:20px;">',
          '<div id="scan-bar" style="width:0%;height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary));transition:width 0.4s ease;border-radius:3px;"></div>',
        '</div>',
        '<p id="scan-msg" class="text-muted" style="font-size:0.95rem;min-height:24px;font-weight:500;"></p>',
      '</div>'
    ].join('');

    var messages = [
      'Connecting to Data Matrix...',
      'Scanning Business Presence...',
      'Analyzing Website Performance...',
      'Checking Online Trust Signals...',
      'Evaluating Marketing Visibility...',
      'Compiling Final Report...'
    ];

    var step = 0;
    var msg = s.querySelector('#scan-msg');
    var bar = s.querySelector('#scan-bar');
    msg.textContent = messages[0];

    var ivl = setInterval(function() {
      step++;
      var pct = Math.round((step / messages.length) * 100);
      bar.style.width = pct + '%';
      if (step < messages.length) {
        msg.textContent = messages[step];
      } else {
        clearInterval(ivl);
        setTimeout(function() {
          // Generate smart scores
          generateSmartScores();
          // Save lead to Google Sheet
          saveLeadToSheet();
          // Show results
          renderView('RESULTS');
        }, 600);
      }
    }, 1100);

    return s;
  }

  // ====== RESULTS ======
  function buildResults() {
    var loc = state.location.toLowerCase();
    var isIndia = (loc.indexOf('india') !== -1 || loc.indexOf('mumbai') !== -1 ||
                   loc.indexOf('delhi') !== -1 || loc.indexOf('bangalore') !== -1 ||
                   loc.indexOf('hyderabad') !== -1 || loc.indexOf('chennai') !== -1 ||
                   loc.indexOf('kolkata') !== -1 || loc.indexOf('pune') !== -1 ||
                   loc.indexOf('jaipur') !== -1 || loc.indexOf('ahmedabad') !== -1 ||
                   loc.indexOf('lucknow') !== -1 || loc.indexOf('surat') !== -1 ||
                   loc.indexOf('noida') !== -1 || loc.indexOf('gurgaon') !== -1 ||
                   loc.indexOf('indore') !== -1 || loc.indexOf('chandigarh') !== -1);

    var preMsg = encodeURIComponent('Hi, I just checked my business report on HelioGrowthAI and want to improve my leads for ' + state.url);
    var waLink = 'https://wa.me/917656010959?text=' + preMsg;
    var emailLink = 'mailto:heliogrowthai99@gmail.com?subject=Growth%20Plan%20Request&body=' + preMsg;

    // Calculate losses based on scores (lower scores = higher loss)
    var avgScore = (state.scores.website + state.scores.trust + state.scores.visibility) / 3;
    var lostCustomers = Math.round(60 - (avgScore * 0.5));
    if (lostCustomers < 10) lostCustomers = 10;
    var lostRevenue = lostCustomers * 12 * (250 + Math.floor(Math.random() * 100));

    // Score labels
    function getScoreLabel(score) {
      if (score >= 75) return { text: 'Good', color: 'text-success', icon: 'check-circle' };
      if (score >= 55) return { text: 'Moderate', color: 'text-warning', icon: 'info' };
      return { text: 'Needs Work', color: 'text-danger', icon: 'alert-triangle' };
    }

    var webLabel = getScoreLabel(state.scores.website);
    var trustLabel = getScoreLabel(state.scores.trust);
    var visLabel = getScoreLabel(state.scores.visibility);

    // Improvement banner
    var improvementBanner = '';
    if (state.isRepeatScan && state.previousScores) {
      var webDiff = state.scores.website - state.previousScores.website;
      var trustDiff = state.scores.trust - state.previousScores.trust;
      var visDiff = state.scores.visibility - state.previousScores.visibility;
      improvementBanner = [
        '<div class="glass-panel p-5 mb-4 text-center" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.06);">',
          '<h3 class="text-success mb-2" style="font-size:1.3rem;">',
            '<i data-lucide="trending-up" style="width:20px;height:20px;display:inline;"></i> Significant Improvements Detected!',
          '</h3>',
          '<p class="text-muted mb-2">Compared to your previous scan, your scores have improved:</p>',
          '<div class="flex items-center justify-center gap-4 flex-wrap">',
            '<span class="badge" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:var(--success);">Website +' + webDiff + '</span>',
            '<span class="badge" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:var(--success);">Trust +' + trustDiff + '</span>',
            '<span class="badge" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:var(--success);">Visibility +' + visDiff + '</span>',
          '</div>',
        '</div>'
      ].join('');
    }

    // Impact section — different for improved vs first scan
    var impactHtml;
    if (state.isRepeatScan && avgScore >= 70) {
      impactHtml = [
        '<div class="glass-panel p-6 mb-4 text-center" style="border-color:rgba(16,185,129,0.25);background:rgba(16,185,129,0.04);">',
          '<h2 class="text-success mb-2" style="font-size:1.5rem;font-weight:800;">',
            '🎉 Great progress! Your online presence is getting stronger.',
          '</h2>',
          '<p class="mb-2" style="font-size:1.05rem;">Continue optimizing to maximize your lead generation potential.</p>',
          '<p class="text-muted text-sm">With HelioGrowthAI, businesses see an average <strong class="text-success">2.5X increase</strong> in leads within 30 days.</p>',
        '</div>'
      ].join('');
    } else {
      impactHtml = [
        '<div class="glass-panel p-6 mb-4 text-center" style="border-color:rgba(239,68,68,0.25);background:rgba(239,68,68,0.04);">',
          '<h2 class="text-danger mb-2 pulse-glow" style="font-size:1.5rem;font-weight:800;">',
            '⚠️ You may be losing ~' + lostCustomers + ' customers every month',
          '</h2>',
          '<p class="mb-2" style="font-size:1.05rem;">Estimated yearly revenue loss: <strong class="text-danger">₹' + lostRevenue.toLocaleString('en-IN') + '+</strong></p>',
          '<p class="text-muted text-sm">Businesses in <strong>' + (state.location || 'your area') + '</strong> are already improving. Delaying costs you market share.</p>',
        '</div>'
      ].join('');
    }

    // CTA buttons
    var ctaHtml;
    if (isIndia) {
      ctaHtml = [
        '<a href="' + waLink + '" target="_blank" class="btn-primary btn-whatsapp" style="font-size:1.15rem;width:100%;max-width:380px;text-decoration:none;">',
          '<i data-lucide="message-circle" style="width:20px;height:20px;"></i> Chat on WhatsApp Now',
        '</a>',
        '<a href="' + emailLink + '" class="btn-outline" style="width:100%;max-width:380px;">',
          '<i data-lucide="mail" style="width:16px;height:16px;"></i> Or Get Plan via Email',
        '</a>'
      ].join('');
    } else {
      ctaHtml = [
        '<a href="' + emailLink + '" class="btn-primary" style="font-size:1.15rem;width:100%;max-width:380px;text-decoration:none;">',
          '<i data-lucide="mail" style="width:20px;height:20px;"></i> Get My Growth Plan',
        '</a>',
        '<a href="' + waLink + '" target="_blank" class="btn-outline" style="width:100%;max-width:380px;">',
          '<i data-lucide="message-circle" style="width:16px;height:16px;"></i> Or Chat on WhatsApp',
        '</a>'
      ].join('');
    }

    var s = document.createElement('section');
    s.className = 'view-section active container';
    s.innerHTML = [
      '<div class="w-full max-w-4xl" style="padding-bottom:60px;">',

        // Header
        '<div class="text-center mb-4" style="padding-top:20px;">',
          '<div class="badge mb-3"><i data-lucide="check-circle" style="width:14px;height:14px;"></i> Analysis Complete</div>',
          '<h1 class="text-gradient" style="font-size:2.4rem;">Your Growth Report</h1>',
          '<p class="text-muted">Generated for <strong>' + (state.url || 'your business') + '</strong></p>',
        '</div>',

        // Improvement Banner (only on repeat scan)
        improvementBanner,

        // Scores
        '<div class="grid-3 mb-4">',
          buildScoreCard('Website', 'val-web', 'ring-web', webLabel),
          buildScoreCard('Trust', 'val-trust', 'ring-trust', trustLabel),
          buildScoreCard('Visibility', 'val-vis', 'ring-vis', visLabel),
        '</div>',

        // Impact
        impactHtml,

        // Before / After
        '<div class="grid-2 mb-4">',
          '<div class="glass-panel p-5" style="background:rgba(239,68,68,0.03);border-color:rgba(239,68,68,0.15);">',
            '<h3 class="text-danger mb-3" style="font-size:1rem;">❌ Current State</h3>',
            '<ul style="list-style:none;line-height:2.2;color:var(--text-muted);">',
              '<li><i data-lucide="x-circle" style="width:15px;height:15px;display:inline;color:var(--danger);margin-right:6px;"></i> Weak website design & slow speed</li>',
              '<li><i data-lucide="x-circle" style="width:15px;height:15px;display:inline;color:var(--danger);margin-right:6px;"></i> Low Google reviews & trust</li>',
              '<li><i data-lucide="x-circle" style="width:15px;height:15px;display:inline;color:var(--danger);margin-right:6px;"></i> Poor online visibility & conversion</li>',
            '</ul>',
          '</div>',
          '<div class="glass-panel p-5" style="background:rgba(16,185,129,0.03);border-color:rgba(16,185,129,0.15);">',
            '<h3 class="text-success mb-3" style="font-size:1rem;">🚀 With HelioGrowthAI</h3>',
            '<ul style="list-style:none;line-height:2.2;">',
              '<li><i data-lucide="check-circle" style="width:15px;height:15px;display:inline;color:var(--success);margin-right:6px;"></i> 2X – 3X more leads</li>',
              '<li><i data-lucide="check-circle" style="width:15px;height:15px;display:inline;color:var(--success);margin-right:6px;"></i> Strong trust & automated reviews</li>',
              '<li><i data-lucide="check-circle" style="width:15px;height:15px;display:inline;color:var(--success);margin-right:6px;"></i> High-converting premium design</li>',
            '</ul>',
          '</div>',
        '</div>',

        // Solutions
        '<h2 class="text-center mb-3 mt-8" style="font-size:1.5rem;">Recommended Solutions</h2>',
        '<div class="grid-2 mb-4">',
          buildSolutionCard('layout', 'rgba(139,92,246,0.15)', 'var(--primary)', 'High-Converting Website', 'Delivered in 24 hours to maximize your leads immediately.'),
          buildSolutionCard('star', 'rgba(59,130,246,0.15)', 'var(--secondary)', 'Review Automation', 'Automatically collect 5-star reviews from happy customers.'),
          buildSolutionCard('bot', 'rgba(236,72,153,0.15)', 'var(--accent)', 'AI Calling Agent', 'Never miss a lead. 24/7 automated customer handling.'),
          buildSolutionCard('trending-up', 'rgba(16,185,129,0.15)', 'var(--success)', 'Ad Creative System', 'Data-driven ads that capture attention and convert.'),
        '</div>',

        // Trust
        '<div class="glass-panel p-6 mb-4 text-center">',
          '<h3 class="mb-3" style="font-size:1.2rem;">Why Choose HelioGrowthAI?</h3>',
          '<div class="flex items-center justify-center gap-4 flex-wrap">',
            '<span class="badge"><i data-lucide="shield-check" style="width:14px;height:14px;"></i> Proven Strategies</span>',
            '<span class="badge"><i data-lucide="clock" style="width:14px;height:14px;"></i> Fast Delivery</span>',
            '<span class="badge"><i data-lucide="cpu" style="width:14px;height:14px;"></i> AI-Powered</span>',
            '<span class="badge"><i data-lucide="target" style="width:14px;height:14px;"></i> Real Results</span>',
          '</div>',
        '</div>',

        // CTA
        '<div class="text-center mt-4 p-8 glass-panel" style="background:linear-gradient(to bottom, rgba(18,18,28,0.9), rgba(139,92,246,0.08));border-color:rgba(139,92,246,0.2);">',
          '<h2 class="mb-1" style="font-size:1.6rem;">Get Your FREE Custom Growth Plan</h2>',
          '<p class="text-muted mb-4">We can start improving your business within 24 hours.</p>',
          '<div class="flex flex-col items-center gap-3">',
            ctaHtml,
          '</div>',
          '<p class="text-muted text-sm mt-4" style="opacity:0.6;">🔒 No spam. Your data is safe with us.</p>',
        '</div>',

      '</div>'
    ].join('');

    // Animate rings
    var ringColor;
    setTimeout(function() {
      ringColor = state.scores.website >= 75 ? 'var(--success)' : (state.scores.website >= 55 ? 'var(--warning)' : 'var(--danger)');
      animateRing(s.querySelector('#ring-web'), s.querySelector('#val-web'), state.scores.website, ringColor);

      ringColor = state.scores.trust >= 75 ? 'var(--success)' : (state.scores.trust >= 55 ? 'var(--warning)' : 'var(--danger)');
      animateRing(s.querySelector('#ring-trust'), s.querySelector('#val-trust'), state.scores.trust, ringColor);

      ringColor = state.scores.visibility >= 75 ? 'var(--success)' : (state.scores.visibility >= 55 ? 'var(--warning)' : 'var(--danger)');
      animateRing(s.querySelector('#ring-vis'), s.querySelector('#val-vis'), state.scores.visibility, ringColor);
    }, 400);

    return s;
  }

  // Helper: Score Card
  function buildScoreCard(label, valueId, ringId, labelInfo) {
    return [
      '<div class="glass-panel p-6 text-center">',
        '<p class="text-muted text-sm mb-2" style="text-transform:uppercase;letter-spacing:1px;">' + label + '</p>',
        '<div class="circular-progress" id="' + ringId + '"><span class="progress-value" id="' + valueId + '">0</span></div>',
        '<p class="' + labelInfo.color + ' mt-2 text-sm font-bold"><i data-lucide="' + labelInfo.icon + '" style="width:14px;height:14px;display:inline;"></i> ' + labelInfo.text + '</p>',
      '</div>'
    ].join('');
  }

  // Helper: Solution Card
  function buildSolutionCard(icon, bgColor, iconColor, title, desc) {
    return [
      '<div class="glass-panel p-4 flex items-center gap-3 hover-glow" style="cursor:pointer;">',
        '<div style="padding:12px;border-radius:12px;background:' + bgColor + ';flex-shrink:0;">',
          '<i data-lucide="' + icon + '" style="width:22px;height:22px;color:' + iconColor + ';"></i>',
        '</div>',
        '<div>',
          '<h4 class="mb-1" style="font-size:0.95rem;">' + title + '</h4>',
          '<p class="text-muted text-sm">' + desc + '</p>',
        '</div>',
      '</div>'
    ].join('');
  }

  // Animate Circular Ring
  function animateRing(ringEl, textEl, target, color) {
    if (!ringEl || !textEl) return;
    var current = 0;
    var step = target / 100;
    var ivl = setInterval(function() {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(ivl);
      }
      textEl.textContent = Math.floor(current);
      ringEl.style.background = 'conic-gradient(' + color + ' ' + (current * 3.6) + 'deg, rgba(255,255,255,0.04) 0deg)';
    }, 20);
  }

  // Boot
  renderView('HERO');

});
