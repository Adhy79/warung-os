// WARUNG OS V1.1 — NGOMONG AJA 🎙️
// Conversational Natural Voice & Text Assistant for Warung Owners

import { store, formatRupiah } from '../data/store.js';
import { NgomongParser } from '../ngomong/parser.js';
import { executeConfirmedDraft, cancelPendingDraft } from '../ngomong/confirmation.js';
import { INTENTS } from '../ngomong/intent.js';
import { showToast } from '../utils/toast.js';

export function renderNgomong(container) {
  const parser = new NgomongParser(store);
  let isListening = false;
  let recognition = null;
  let hasSpeechSupport = false;

  // Initial greeting
  const messages = [
    {
      sender: 'warung',
      text: 'Mau cerita apa, Bu? Ceritakan saja jualan, utang, belanja stok, atau mau tanya sesuatu 😊'
    }
  ];

  // Quick Chips for effortless testing & everyday prompts
  const quickSuggestions = [
    'Tadi Bu Siti ngutang tiga Indomie sama satu es teh',
    'Budi bayar utang sepuluh ribu',
    'Tadi laku dua Indomie',
    'Tadi beli gas dua puluh ribu',
    'Jualan hari ini berapa?',
    'Besok belanja apa?'
  ];

  function speakText(text) {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // stop any ongoing speech
        const clean = text.replace(/[*_#•]/g, '').slice(0, 150);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Non-intrusive speech fallback
    }
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      hasSpeechSupport = true;
      recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening = true;
        updateMicButtonUI('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        isListening = false;
        updateMicButtonUI('processing');
        handleUserMessage(transcript);
      };

      recognition.onerror = (event) => {
        isListening = false;
        updateMicButtonUI('idle');
        if (event.error === 'not-allowed') {
          showToast("Ketuk 'Izinkan' mikrofon di HP ya Bu 😊", 'error');
        } else if (event.error === 'no-speech') {
          showToast('Suara belum terdengar, coba tekan lagi ya Bu 😊', 'info');
        } else {
          showToast('Suara belum jelas, coba ulangi lagi ya Bu 😊', 'info');
        }
      };

      recognition.onend = () => {
        isListening = false;
        updateMicButtonUI('idle');
      };
    } else {
      hasSpeechSupport = false;
    }
  }

  function updateMicButtonUI(state) {
    const btn = document.getElementById('btn-ngomong-mic');
    const label = document.getElementById('mic-action-label');
    const sub = document.getElementById('mic-status-sub');
    if (!btn || !label || !sub) return;

    if (state === 'listening') {
      btn.classList.add('listening');
      btn.innerHTML = `
        <span class="mic-icon-large pulse-red">🔴</span>
        <span class="mic-label-text" id="mic-action-label" style="color: #DC2626;">SAYA DENGARKAN...</span>
      `;
      sub.textContent = 'Silakan bicara santai saja ya Bu/Pak 😊';
      sub.style.color = '#DC2626';
    } else if (state === 'processing') {
      btn.classList.remove('listening');
      btn.innerHTML = `
        <span class="mic-icon-large">⏳</span>
        <span class="mic-label-text" id="mic-action-label">MEMAHAMI...</span>
      `;
      sub.textContent = 'Sebentar, saya pahami dulu ya 😊';
      sub.style.color = 'var(--color-primary-dark)';
    } else {
      btn.classList.remove('listening');
      btn.innerHTML = `
        <span class="mic-icon-large">🎙️</span>
        <span class="mic-label-text" id="mic-action-label">TEKAN UNTUK BICARA</span>
      `;
      sub.textContent = hasSpeechSupport
        ? 'Tekan tombol mikrofon lalu ceritakan apa saja 😊'
        : 'Fitur bicara belum tersedia di HP/browser ini. Ibu bisa mengetik di bawah.';
      sub.style.color = 'var(--color-text-muted)';
    }
  }

  function toggleSpeech() {
    if (!hasSpeechSupport) {
      showToast('Ibu bisa mengetik di kotak tulisan di bawah ya 😊', 'info');
      const input = document.getElementById('ngomong-text-input');
      input?.focus();
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (e) {}
    } else {
      try {
        recognition.start();
      } catch (e) {
        showToast('Gagal memulai mikrofon, coba lagi ya Bu', 'error');
      }
    }
  }

  function handleUserMessage(rawText) {
    if (!rawText || !rawText.trim()) return;

    // 1. Add user bubble
    messages.push({
      sender: 'user',
      text: rawText.trim()
    });
    renderChatStream();

    // 2. Parse using modular NgomongParser
    const result = parser.parse(rawText);

    // 3. Handle parser results
    if (result.status === 'EXECUTE_CONFIRMED') {
      const exec = executeConfirmedDraft(result.draft, store);
      messages.push({
        sender: 'warung',
        text: exec.message || 'Alhamdulillah sudah dicatat ya, Bu 😊'
      });
      speakText(exec.message || 'Sudah dicatat Bu.');
      showToast('Transaksi berhasil disimpan! 😊', 'success');
    } else if (result.status === 'EXECUTE_CANCELLED') {
      cancelPendingDraft(result.draft);
      messages.push({
        sender: 'warung',
        text: 'Baik Bu, pencatatan dibatalkan. Data warung tetap aman tidak berubah 😊'
      });
      showToast('Pencatatan dibatalkan 😊', 'info');
    } else if (result.status === 'QUERY_ANSWER') {
      messages.push({
        sender: 'warung',
        text: result.answer
      });
      speakText(result.answer);
    } else if (result.status === 'DRAFT_READY') {
      messages.push({
        sender: 'warung',
        isDraft: true,
        draft: result.draft,
        summary: result.summary
      });
      // Short friendly speech prompt
      if (result.intent === INTENTS.SALE_DEBT) {
        speakText(`Mau dicatat sebagai utang ${result.draft.debtorName}, Bu?`);
      } else if (result.intent === INTENTS.DEBT_PAYMENT) {
        speakText(`Catat pembayaran utang ${result.draft.personName}, Bu?`);
      } else {
        speakText(`Total ${formatRupiah(result.draft.total || result.draft.amount)}. Mau dicatat?`);
      }
    } else if (result.status === 'AMBIGUOUS_PRODUCT') {
      messages.push({
        sender: 'warung',
        text: result.question,
        options: result.options,
        actionType: 'CLARIFY_PRODUCT'
      });
      speakText(result.question);
    } else if (result.status === 'AMBIGUOUS_PERSON') {
      messages.push({
        sender: 'warung',
        text: result.question,
        options: result.options,
        actionType: 'CLARIFY_PERSON'
      });
      speakText(result.question);
    } else if (result.status === 'AMBIGUOUS_AMOUNT') {
      messages.push({
        sender: 'warung',
        text: result.question,
        options: result.options,
        actionType: 'CLARIFY_AMOUNT',
        suggestedAmount: result.suggestedAmount
      });
      speakText(result.question);
    } else if (result.status === 'PRODUCT_NOT_FOUND') {
      messages.push({
        sender: 'warung',
        text: result.question,
        options: result.options,
        actionType: 'NOT_FOUND_PRODUCT',
        queriedName: result.queriedName
      });
      speakText(result.question);
    } else if (result.status === 'PERSON_NOT_FOUND') {
      messages.push({
        sender: 'warung',
        text: result.question,
        options: result.options,
        actionType: 'NOT_FOUND_PERSON',
        personName: result.personName,
        items: result.items
      });
      speakText(result.question);
    } else {
      messages.push({
        sender: 'warung',
        text: result.message || 'Maaf Bu, saya belum begitu paham. Boleh diceritakan lagi? 😊'
      });
      speakText('Boleh diceritakan lagi ya Bu?');
    }

    renderChatStream();
    updateMicButtonUI('idle');
  }

  function handleDraftConfirm(draftIndex) {
    const msg = messages[draftIndex];
    if (!msg || !msg.draft) return;

    const draft = msg.draft;
    const exec = executeConfirmedDraft(draft, store);

    // Remove draft action buttons so user cannot double-click
    msg.isConfirmed = true;
    messages.push({
      sender: 'warung',
      text: exec.message || 'Alhamdulillah sudah dicatat ya, Bu 😊'
    });

    speakText(exec.message || 'Sudah dicatat Bu.');
    showToast(exec.message || 'Transaksi berhasil disimpan! 😊', 'success');
    renderChatStream();
  }

  function handleDraftCancel(draftIndex) {
    const msg = messages[draftIndex];
    if (!msg) return;

    cancelPendingDraft(msg.draft);
    msg.isCancelled = true;

    messages.push({
      sender: 'warung',
      text: 'Baik Bu, pencatatan dibatalkan. Tidak ada data yang diubah ya 😊'
    });

    showToast('Pencatatan dibatalkan 😊', 'info');
    renderChatStream();
  }

  function handleClarificationOption(optionText, msgIndex) {
    const msg = messages[msgIndex];
    if (msg) msg.isResolved = true;

    if (optionText === 'BATAL' || optionText === 'BUKAN') {
      messages.push({
        sender: 'warung',
        text: 'Baik Bu, tidak apa-apa 😊'
      });
      renderChatStream();
      return;
    }

    if (optionText === 'TAMBAH' && msg?.actionType === 'NOT_FOUND_PERSON') {
      // Add person and draft debt
      const pName = msg.personName;
      const total = (msg.items || []).reduce((sum, i) => sum + i.subtotal, 0);
      const draft = {
        type: INTENTS.SALE_DEBT,
        isDebt: true,
        debtorName: pName,
        items: msg.items || [],
        total,
        confidence: 0.95
      };
      messages.push({
        sender: 'warung',
        isDraft: true,
        draft,
        summary: `${pName} mau dicatat punya utang:\n${(msg.items || []).map((i) => `${i.name} × ${i.quantity} — Rp${i.subtotal.toLocaleString('id-ID')}`).join('\n') || `Total: Rp${total.toLocaleString('id-ID')}`}\n\nTotal Rp${total.toLocaleString('id-ID')}.\n\nSudah benar?`
      });
      renderChatStream();
      return;
    }

    // Otherwise feed the clarified option back to natural conversation
    handleUserMessage(optionText);
  }

  function renderChatStream() {
    const chatContainer = document.getElementById('ngomong-chat-stream');
    if (!chatContainer) return;

    chatContainer.innerHTML = messages
      .map((msg, index) => {
        if (msg.sender === 'user') {
          return `
            <div class="chat-bubble user-bubble">
              <div class="bubble-content">${escapeHtml(msg.text)}</div>
              <div class="bubble-time">Anda</div>
            </div>
          `;
        }

        // Warung OS System Message
        if (msg.isDraft && msg.draft) {
          const draft = msg.draft;
          const isDone = msg.isConfirmed || msg.isCancelled;

          return `
            <div class="chat-bubble warung-bubble draft-bubble">
              <div class="bubble-badge">📝 RANGKUMAN TERCATAT</div>
              
              ${renderDraftDetails(draft)}

              ${
                !isDone
                  ? `
                <div class="draft-actions">
                  <button class="btn-draft-confirm" data-draft-index="${index}">
                    ✅ CATAT ${draft.type === INTENTS.SALE_CASH ? 'JUALAN' : draft.type === INTENTS.DEBT_PAYMENT ? 'PEMBAYARAN' : ''}
                  </button>
                  <button class="btn-draft-cancel" data-cancel-index="${index}">
                    ❌ BATAL
                  </button>
                </div>
              `
                  : `
                <div class="draft-status-badge ${msg.isConfirmed ? 'confirmed' : 'cancelled'}">
                  ${msg.isConfirmed ? '✅ Sudah disimpan ke data warung' : '❌ Pencatatan dibatalkan'}
                </div>
              `
              }
            </div>
          `;
        }

        // Clarification Question with Interactive Buttons
        if (msg.options && msg.options.length > 0) {
          return `
            <div class="chat-bubble warung-bubble">
              <div class="bubble-content">${nl2br(escapeHtml(msg.text))}</div>
              ${
                !msg.isResolved
                  ? `
                <div class="clarify-options-container">
                  ${msg.options
                    .map(
                      (opt) => `
                    <button class="btn-clarify-opt" data-opt="${escapeHtml(opt)}" data-msg-index="${index}">
                      ${escapeHtml(opt)}
                    </button>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `;
        }

        // Regular Warung Response
        return `
          <div class="chat-bubble warung-bubble">
            <div class="bubble-content">${nl2br(escapeHtml(msg.text))}</div>
          </div>
        `;
      })
      .join('');

    // Auto-scroll chat to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Attach Draft Confirm/Cancel Listeners
    chatContainer.querySelectorAll('.btn-draft-confirm').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-draft-index'), 10);
        handleDraftConfirm(idx);
      });
    });

    chatContainer.querySelectorAll('.btn-draft-cancel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-cancel-index'), 10);
        handleDraftCancel(idx);
      });
    });

    // Attach Clarify Options Listeners
    chatContainer.querySelectorAll('.btn-clarify-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const opt = btn.getAttribute('data-opt');
        const idx = parseInt(btn.getAttribute('data-msg-index'), 10);
        handleClarificationOption(opt, idx);
      });
    });
  }

  function renderDraftDetails(draft) {
    if (draft.type === INTENTS.SALE_DEBT) {
      return `
        <div class="draft-detail-card">
          <div class="draft-person-header">👤 ${escapeHtml(draft.debtorName)}</div>
          <div class="draft-label-small">Barang yang diambil (Ngutang):</div>
          <div class="draft-items-list">
            ${(draft.items || [])
              .map(
                (i) => `
              <div class="draft-item-row">
                <span>• ${escapeHtml(i.name)} × ${i.quantity}</span>
                <span class="draft-item-price">${formatRupiah(i.subtotal)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          <div class="draft-total-row debt-total">
            <span>Total Utang:</span>
            <span class="draft-amount-highlight debt-color">${formatRupiah(draft.total)}</span>
          </div>
          <div class="draft-subtext-hint">Uang kas belum bertambah sampai dibayar ya Bu.</div>
        </div>
      `;
    }

    if (draft.type === INTENTS.DEBT_PAYMENT) {
      return `
        <div class="draft-detail-card">
          <div class="draft-person-header">👤 ${escapeHtml(draft.personName)} (Bayar Utang)</div>
          <div class="draft-debt-calc">
            <div class="calc-line">
              <span>Utang sebelumnya:</span>
              <span>${formatRupiah(draft.previousDebt)}</span>
            </div>
            <div class="calc-line pay-line">
              <span>Bayar:</span>
              <span style="color: var(--color-success-dark); font-weight: 800;">-${formatRupiah(draft.amount)}</span>
            </div>
            <div class="calc-line total-line">
              <span>Sisa utang:</span>
              <span style="color: #DC2626; font-weight: 900;">${formatRupiah(draft.remainingDebt)}</span>
            </div>
          </div>
          <div class="draft-subtext-hint">Uang kas akan bertambah ${formatRupiah(draft.amount)}, total jualan tidak berubah.</div>
        </div>
      `;
    }

    if (draft.type === INTENTS.EXPENSE) {
      return `
        <div class="draft-detail-card">
          <div class="draft-person-header">💸 PENGELUARAN WARUNG</div>
          <div class="draft-items-list">
            <div class="draft-item-row">
              <span style="font-weight: 700;">${escapeHtml(draft.description)}</span>
              <span class="draft-amount-highlight exp-color">${formatRupiah(draft.amount)}</span>
            </div>
          </div>
          <div class="draft-subtext-hint">Uang kas akan berkurang ${formatRupiah(draft.amount)}.</div>
        </div>
      `;
    }

    // Default SALE_CASH
    return `
      <div class="draft-detail-card">
        <div class="draft-person-header">🛒 JUALAN TUNAI</div>
        <div class="draft-items-list">
          ${(draft.items || [])
            .map(
              (i) => `
            <div class="draft-item-row">
              <span>• ${escapeHtml(i.name)} × ${i.quantity}</span>
              <span class="draft-item-price">${formatRupiah(i.subtotal)}</span>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="draft-total-row">
          <span>Total Jualan:</span>
          <span class="draft-amount-highlight">${formatRupiah(draft.total)}</span>
        </div>
        <div class="draft-subtext-hint">Pembayaran tunai lunas, langsung masuk uang kas.</div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nl2br(str) {
    if (!str) return '';
    return str.replace(/\n/g, '<br>');
  }

  // Render Component Shell
  container.innerHTML = `
    <div class="ngomong-page-wrapper">
      
      <!-- Top Title Header -->
      <div class="ngomong-header-card">
        <div class="ngomong-title-row">
          <span class="ngomong-header-icon">🎙️</span>
          <div>
            <h1 class="ngomong-title">NGOMONG AJA</h1>
            <p class="ngomong-subtitle">Ceritakan saja seperti ngobrol 😊</p>
          </div>
        </div>
      </div>

      <!-- Quick Suggestion Chips -->
      <div class="quick-chips-wrapper">
        <div class="quick-chips-scroll">
          ${quickSuggestions
            .map(
              (s) => `
            <button class="chip-item" data-suggestion="${escapeHtml(s)}">
              💬 "${escapeHtml(s)}"
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Conversation Chat Stream Area -->
      <div class="ngomong-chat-container" id="ngomong-chat-stream"></div>

      <!-- Bottom Audio / Speech Input Controls -->
      <div class="ngomong-input-dock">
        
        <!-- Big Round Microphone Button -->
        <div class="mic-button-wrapper">
          <button class="btn-huge-mic" id="btn-ngomong-mic" aria-label="Tekan untuk bicara">
            <span class="mic-icon-large">🎙️</span>
            <span class="mic-label-text" id="mic-action-label">TEKAN UNTUK BICARA</span>
          </button>
          <div class="mic-status-hint" id="mic-status-sub">
            Tekan tombol mikrofon lalu ceritakan apa saja 😊
          </div>
        </div>

        <!-- Alternative Text Input Field -->
        <form class="text-input-form" id="form-ngomong-text">
          <input 
            type="text" 
            id="ngomong-text-input" 
            class="input-clean-chat" 
            placeholder="Coba bilang: Budi bayar utang sepuluh ribu" 
            autocomplete="off"
          />
          <button type="submit" class="btn-send-chat" id="btn-ngomong-send">
            KIRIM
          </button>
        </form>

      </div>

    </div>
  `;

  // Initialize Speech and Chat Stream
  initSpeechRecognition();
  renderChatStream();

  // Attach Microphone Click
  const micBtn = document.getElementById('btn-ngomong-mic');
  micBtn?.addEventListener('click', () => {
    toggleSpeech();
  });

  // Attach Text Input Submit
  const textForm = document.getElementById('form-ngomong-text');
  const textInput = document.getElementById('ngomong-text-input');
  textForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = textInput.value;
    if (val && val.trim()) {
      textInput.value = '';
      handleUserMessage(val);
    }
  });

  // Attach Quick Suggestion Chips
  container.querySelectorAll('.chip-item').forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-suggestion');
      if (text) {
        handleUserMessage(text);
      }
    });
  });
}
