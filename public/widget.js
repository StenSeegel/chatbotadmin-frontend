(function () {
  // 1. Inject Google Fonts & Material Icons (once globally)
  if (!document.getElementById('widget-google-fonts')) {
    const fontsLink = document.createElement('link');
    fontsLink.id = 'widget-google-fonts';
    fontsLink.rel = 'stylesheet';
    fontsLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@400,0..1&display=swap';
    document.head.appendChild(fontsLink);
  }

  // 2. Define configurations for default widgets (from Widgets database)
  const widgetConfigs = {
    'support-bot': {
      title: 'JLU Assistent',
      greeting: 'Hallo! Wie kann ich dir heute helfen?',
      accentColor: '#0052ff',
      position: 'bottom-right',
      icon: 'language',
      templates: ['Was ist die JLU?', 'Wie bewerbe ich mich?', 'Semesterticket', 'Öffnungszeiten'],
      rules: [
        'Nur auf Deutsch antworten',
        'Keine persönlichen Daten speichern',
        'Keine medizinischen Ratschläge geben'
      ]
    },
    'sales-tracker': {
      title: 'Sales Tracker',
      greeting: 'Willkommen zurück! Wobei kann ich unterstützen?',
      accentColor: '#7c4dff',
      position: 'bottom-left',
      icon: 'analytics',
      templates: ['Verkaufszahlen Q2', 'Neuste Leads', 'Support-Status'],
      rules: []
    }
  };

  // 3. Fallback configuration
  const defaultConfig = {
    title: 'ChatBot Support',
    greeting: 'Hallo! Wie kann ich dir helfen?',
    accentColor: '#0052ff',
    position: 'bottom-right',
    icon: 'smart_toy',
    templates: ['Hilfe', 'Kontakt'],
    rules: []
  };

  // 4. Function to initialize a single widget in a given container element
  function initWidget(containerEl) {
    const widgetId = containerEl.getAttribute('data-widget-id') || 'support-bot';
    const kbId = containerEl.getAttribute('data-kb') || 'jlu-public-2024';
    const routing = containerEl.getAttribute('data-routing') || 'public-widget';
    const lang = containerEl.getAttribute('data-lang') || 'de';

    // Merge configuration
    const activeConfig = Object.assign(
      {},
      defaultConfig,
      widgetConfigs[widgetId] || {},
      {
        // Allow overriding via custom container attributes
        title: containerEl.getAttribute('data-title') || (widgetConfigs[widgetId] && widgetConfigs[widgetId].title) || defaultConfig.title,
        greeting: containerEl.getAttribute('data-greeting') || (widgetConfigs[widgetId] && widgetConfigs[widgetId].greeting) || defaultConfig.greeting,
        accentColor: containerEl.getAttribute('data-color') || (widgetConfigs[widgetId] && widgetConfigs[widgetId].accentColor) || defaultConfig.accentColor,
        position: containerEl.getAttribute('data-position') || (widgetConfigs[widgetId] && widgetConfigs[widgetId].position) || defaultConfig.position,
        icon: containerEl.getAttribute('data-icon') || (widgetConfigs[widgetId] && widgetConfigs[widgetId].icon) || defaultConfig.icon,
      }
    );

    // Inject styles specific to this widget instance
    const styleEl = document.createElement('style');
    styleEl.id = `widget-styles-${widgetId}`;
    styleEl.innerHTML = `
      .chatbot-widget-wrapper {
        position: fixed;
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      /* Position setups */
      .chatbot-widget-wrapper.bottom-right { bottom: 24px; right: 24px; align-items: flex-end; }
      .chatbot-widget-wrapper.bottom-left { bottom: 24px; left: 24px; align-items: flex-start; }
      .chatbot-widget-wrapper.top-right { top: 24px; right: 24px; align-items: flex-end; }
      .chatbot-widget-wrapper.top-left { top: 24px; left: 24px; align-items: flex-start; }

      /* Floating Action Button (FAB) */
      .chatbot-fab {
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background-color: ${activeConfig.accentColor};
        color: #ffffff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        outline: none;
      }
      .chatbot-fab:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      .chatbot-fab span.material-symbols-outlined {
        font-size: 28px;
        font-variation-settings: 'FILL' 1;
      }

      /* Chat Window */
      .chatbot-window {
        width: 380px;
        height: 580px;
        max-height: calc(100vh - 120px);
        max-width: calc(100vw - 48px);
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 16px;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Window Positioning details */
      .chatbot-widget-wrapper.top-right .chatbot-window,
      .chatbot-widget-wrapper.top-left .chatbot-window {
        margin-bottom: 0;
        margin-top: 16px;
      }
      
      .chatbot-window.open {
        display: flex;
        opacity: 1;
        transform: translateY(0);
      }

      /* Chat Header */
      .chatbot-header {
        background-color: ${activeConfig.accentColor};
        color: #ffffff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .chatbot-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .chatbot-header-avatar {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .chatbot-header-avatar span {
        font-size: 20px;
        font-variation-settings: 'FILL' 1;
      }
      .chatbot-header-title {
        font-weight: 600;
        font-size: 15px;
        margin: 0;
        line-height: 1.2;
      }
      .chatbot-header-status {
        font-size: 11px;
        opacity: 0.85;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .chatbot-header-status::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 4px;
        background-color: #22c55e;
      }
      .chatbot-header-close {
        background: none;
        border: none;
        color: #ffffff;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }
      .chatbot-header-close:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }

      /* Message List Area */
      .chatbot-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background-color: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Single Message Bubble */
      .chatbot-message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.5;
        position: relative;
        word-wrap: break-word;
        animation: chatbot-fade-in 0.25s ease-out forwards;
      }
      @keyframes chatbot-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .chatbot-message.bot {
        background-color: #ffffff;
        color: #1e293b;
        align-self: flex-start;
        border-bottom-left-radius: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03);
      }
      .chatbot-message.user {
        background-color: ${activeConfig.accentColor};
        color: #ffffff;
        align-self: flex-end;
        border-bottom-right-radius: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      /* Feedback buttons under bot message */
      .chatbot-feedback {
        display: flex;
        gap: 8px;
        margin-top: 4px;
        margin-left: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .chatbot-feedback:hover {
        opacity: 1;
      }
      .chatbot-feedback-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 2px;
        font-size: 16px;
        display: flex;
        align-items: center;
        transition: color 0.2s;
      }
      .chatbot-feedback-btn:hover {
        color: ${activeConfig.accentColor};
      }
      .chatbot-feedback-btn.active {
        color: ${activeConfig.accentColor};
        font-variation-settings: 'FILL' 1;
      }

      /* Typing Indicator */
      .chatbot-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 18px;
      }
      .chatbot-typing-dot {
        width: 6px;
        height: 6px;
        background-color: #94a3b8;
        border-radius: 50%;
        animation: chatbot-bounce 1.4s infinite ease-in-out both;
      }
      .chatbot-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .chatbot-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes chatbot-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }

      /* Suggestion Chips */
      .chatbot-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 20px 12px;
        background-color: #f8fafc;
      }
      .chatbot-chip {
        background-color: #ffffff;
        color: ${activeConfig.accentColor};
        border: 1px solid ${activeConfig.accentColor}40;
        border-radius: 16px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .chatbot-chip:hover {
        background-color: ${activeConfig.accentColor}10;
        border-color: ${activeConfig.accentColor};
      }

      /* Footer / Input area */
      .chatbot-footer {
        padding: 12px 16px;
        background-color: #ffffff;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .chatbot-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .chatbot-input:focus {
        border-color: ${activeConfig.accentColor};
      }
      .chatbot-send {
        background-color: ${activeConfig.accentColor};
        color: #ffffff;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
      }
      .chatbot-send:hover {
        brightness: 110%;
      }
      .chatbot-send:active {
        transform: scale(0.95);
      }
      .chatbot-send span {
        font-size: 18px;
      }
    `;
    document.head.appendChild(styleEl);

    // Create Chatbot UI DOM elements inside the wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `chatbot-widget-wrapper ${activeConfig.position}`;
    wrapper.innerHTML = `
      <div class="chatbot-window" id="chatbot-window-${widgetId}">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-header-avatar">
              <span class="material-symbols-outlined">${activeConfig.icon}</span>
            </div>
            <div>
              <h4 class="chatbot-header-title">${activeConfig.title}</h4>
              <div class="chatbot-header-status">${routing.replace('-widget', '')}</div>
            </div>
          </div>
          <button class="chatbot-header-close" id="chatbot-close-btn-${widgetId}">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages-${widgetId}"></div>
        <div class="chatbot-chips" id="chatbot-chips-${widgetId}"></div>
        <div class="chatbot-footer">
          <input type="text" class="chatbot-input" id="chatbot-input-${widgetId}" placeholder="Frage eingeben..." autocomplete="off">
          <button class="chatbot-send" id="chatbot-send-btn-${widgetId}">
            <span class="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
      <button class="chatbot-fab" id="chatbot-fab-${widgetId}">
        <span class="material-symbols-outlined" id="chatbot-fab-icon-${widgetId}">${activeConfig.icon}</span>
      </button>
    `;

    containerEl.appendChild(wrapper);

    // Interactive Logic Elements (scoped to the wrapper element)
    const fab = wrapper.querySelector('.chatbot-fab');
    const chatWindow = wrapper.querySelector('.chatbot-window');
    const closeBtn = wrapper.querySelector('.chatbot-header-close');
    const inputEl = wrapper.querySelector('.chatbot-input');
    const sendBtn = wrapper.querySelector('.chatbot-send');
    const messagesContainer = wrapper.querySelector('.chatbot-messages');
    const chipsContainer = wrapper.querySelector('.chatbot-chips');
    const fabIcon = wrapper.querySelector('.chatbot-fab span');

    let isOpen = false;
    let hasInitiated = false;

    // Toggle Chat Window
    function toggleChat() {
      isOpen = !isOpen;
      if (isOpen) {
        chatWindow.classList.add('open');
        fabIcon.innerText = 'close';
        inputEl.focus();
        if (!hasInitiated) {
          initiateChat();
        }
      } else {
        chatWindow.classList.remove('open');
        fabIcon.innerText = activeConfig.icon;
      }
    }

    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Bot Answers Mock Database
    function getMockAnswer(userText) {
      const text = userText.toLowerCase();
      
      if (widgetId === 'support-bot') {
        if (text.includes('was ist die jlu') || text.includes('giessen')) {
          return 'Die Justus-Liebig-Universität Gießen (JLU) ist eine traditionsreiche Universität mit über 400 Jahren Geschichte. Sie zeichnet sich durch ein breites Fächerspektrum und exzellente Forschung aus!';
        }
        if (text.includes('bewerben') || text.includes('bewerbung')) {
          return 'Die Bewerbung erfolgt online über unser Bewerbungsportal. Die genauen Fristen hängen von deinem Wunschstudiengang ab (meistens 15. Juli für das Wintersemester). Möchtest du Informationen zu Bachelor- oder Masterstudiengängen?';
        }
        if (text.includes('semesterticket') || text.includes('ticket') || text.includes('bus')) {
          return 'Das Semesterticket der JLU ist im Semesterbeitrag enthalten. Es gilt im gesamten RMV-Gebiet und ermöglicht dir die kostenlose Nutzung von Bussen und Regionalzügen in Hessen.';
        }
        if (text.includes('öffnung') || text.includes('zeit') || text.includes('wann')) {
          return 'Das Studierendensekretariat hat Mo-Do von 9:00 bis 16:00 Uhr und Fr von 9:00 bis 12:00 Uhr geöffnet. Die Hauptbibliothek steht dir rund um die Uhr (24/7) zur Verfügung!';
        }
        if (text.includes('hallo') || text.includes('hi') || text.includes('guten tag')) {
          return 'Hallo! Wie kann ich dir heute bei Fragen zur JLU Gießen weiterhelfen?';
        }
        return 'Vielen Dank für deine Nachricht. Als JLU Assistent beantworte ich Fragen basierend auf der Wissensdatenbank. Zu deiner Anfrage habe ich leider keine direkte Übereinstimmung gefunden. Versuche es mit Schlagworten wie "Bewerbung", "Semesterticket" oder "Öffnungszeiten".';
      }

      if (widgetId === 'sales-tracker') {
        if (text.includes('verkäufe') || text.includes('umsatz') || text.includes('q2')) {
          return 'Die Verkaufszahlen für Q2 liegen aktuell um 14% über dem Vorquartal. Besonders stark liefen die Enterprise-Lizenzen.';
        }
        if (text.includes('lead') || text.includes('kunden')) {
          return 'Im CRM wurden heute bereits 18 neue Leads erfasst. Der zugewiesene Vertriebler für Top-Accounts wird direkt per Slack benachrichtigt.';
        }
        return 'Ich bin dein Sales-Tracker. Du kannst mich nach Vertriebszahlen, neuen Leads oder CRM-Informationen fragen!';
      }

      return `Empfangene Nachricht: "${userText}". Dieses Widget läuft im Modus '${widgetId}' (Knowledge-Base: '${kbId}') und ist korrekt eingebettet!`;
    }

    // Append message
    function appendMessage(sender, text) {
      const msgEl = document.createElement('div');
      msgEl.className = `chatbot-message ${sender}`;
      msgEl.innerText = text;

      if (sender === 'bot') {
        messagesContainer.appendChild(msgEl);
        
        // Render feedback buttons
        const showFeedback = containerEl.getAttribute('data-feedback') !== 'false';
        if (showFeedback) {
          const feedbackWrapper = document.createElement('div');
          feedbackWrapper.className = 'chatbot-feedback';
          feedbackWrapper.innerHTML = `
            <button class="chatbot-feedback-btn" data-type="up" title="Hilfreich">
              <span class="material-symbols-outlined" style="font-size: 16px;">thumb_up</span>
            </button>
            <button class="chatbot-feedback-btn" data-type="down" title="Nicht hilfreich">
              <span class="material-symbols-outlined" style="font-size: 16px;">thumb_down</span>
            </button>
          `;
          
          feedbackWrapper.querySelectorAll('.chatbot-feedback-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const isActive = this.classList.contains('active');
              feedbackWrapper.querySelectorAll('.chatbot-feedback-btn').forEach(b => b.classList.remove('active'));
              if (!isActive) {
                this.classList.add('active');
                console.log(`Widget Feedback for ${widgetId}: ${this.dataset.type}`);
              }
            });
          });
          
          messagesContainer.appendChild(feedbackWrapper);
        }
      } else {
        messagesContainer.appendChild(msgEl);
      }
      
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show/Hide Typing Indicator
    let typingIndicatorEl = null;
    function showTypingIndicator() {
      if (typingIndicatorEl) return;
      typingIndicatorEl = document.createElement('div');
      typingIndicatorEl.className = 'chatbot-message bot chatbot-typing';
      typingIndicatorEl.innerHTML = `
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
      `;
      messagesContainer.appendChild(typingIndicatorEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
      if (typingIndicatorEl) {
        typingIndicatorEl.remove();
        typingIndicatorEl = null;
      }
    }

    // Submit user input
    function handleSubmit() {
      const text = inputEl.value.trim();
      if (!text) return;

      inputEl.value = '';
      appendMessage('user', text);
      chipsContainer.style.display = 'none';

      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        const botAnswer = getMockAnswer(text);
        appendMessage('bot', botAnswer);
      }, 1200);
    }

    sendBtn.addEventListener('click', handleSubmit);
    inputEl.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });

    // Initiate chat
    function initiateChat() {
      hasInitiated = true;
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        appendMessage('bot', activeConfig.greeting);
        
        if (activeConfig.templates && activeConfig.templates.length > 0) {
          chipsContainer.innerHTML = '';
          activeConfig.templates.forEach(tpl => {
            const chip = document.createElement('button');
            chip.className = 'chatbot-chip';
            chip.innerText = tpl;
            chip.addEventListener('click', function () {
              inputEl.value = tpl;
              handleSubmit();
            });
            chipsContainer.appendChild(chip);
          });
          chipsContainer.style.display = 'flex';
        } else {
          chipsContainer.style.display = 'none';
        }
      }, 800);
    }
  }

  // 5. Initialize on all placeholders matching selectors
  const selectors = ['.chatbot-widget', '.widget', '#chatbot-root'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      // Prevent double initialization if already initialized OR if nested inside an already initialized container
      if (el.getAttribute('data-chatbot-initialized') === 'true' || 
          el.closest('[data-chatbot-initialized="true"]') ||
          el.querySelector('[data-chatbot-initialized="true"]')) {
        return;
      }
      el.setAttribute('data-chatbot-initialized', 'true');
      initWidget(el);
    });
  });
})();
