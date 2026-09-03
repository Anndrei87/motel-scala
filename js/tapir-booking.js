/**
 * Tapir LP — Redirecionamento para Tapir Booking (reserva/pagamento)
 */
const TapirBooking = {
  config: null,
  pendingUrl: '',
  pendingMeta: null,

  usesExternalBooking(config = this.config) {
    return Boolean(config?.booking?.enabled && config?.booking?.url);
  },

  init(config) {
    this.config = config;
    if (!this.usesExternalBooking(config)) return;

    this.applyDialogCopy(config.booking);
    this.bindModal();
    this.bindTriggers();
  },

  applyDialogCopy(booking) {
    const dialog = booking?.dialog || {};
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && text) el.textContent = text;
    };

    set('booking-redirect-title', dialog.title || 'Redirecionamento para reserva');
    set(
      'booking-redirect-message',
      dialog.message ||
        'Você será direcionado ao domínio da Tapir (Tapir Booking) para concluir a reserva e o pagamento.'
    );
    set('booking-redirect-confirm', dialog.confirmText || 'Continuar para o Tapir Booking');
    set('booking-redirect-cancel', dialog.cancelText || 'Cancelar');

    const domain = document.getElementById('booking-redirect-domain');
    if (domain) {
      try {
        domain.textContent = new URL(booking.url).hostname;
      } catch {
        domain.textContent = dialog.domainHint || 'tapirbooking.com.br';
      }
    }
  },

  buildUrl(extra = {}) {
    const base = this.config.booking.url;
    try {
      const url = new URL(base);
      if (extra.type) url.searchParams.set('from', extra.type);
      if (extra.id) url.searchParams.set('item', extra.id);
      return url.toString();
    } catch {
      return base;
    }
  },

  open(extra = {}) {
    this.pendingUrl = this.buildUrl(extra);
    this.pendingMeta = extra;
    const modal = document.getElementById('booking-redirect-modal');
    if (!modal) {
      window.open(this.pendingUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.getElementById('booking-redirect-confirm')?.focus();
  },

  close() {
    const modal = document.getElementById('booking-redirect-modal');
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    this.pendingUrl = '';
    this.pendingMeta = null;
  },

  confirm() {
    const url = this.pendingUrl || this.config?.booking?.url;
    if (!url) return;

    if (window.TapirAnalytics) {
      window.TapirAnalytics.track('booking_redirect', {
        url,
        ...(this.pendingMeta || {}),
      });
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    this.close();
  },

  bindModal() {
    const modal = document.getElementById('booking-redirect-modal');
    if (!modal || modal.dataset.bound === 'true') return;
    modal.dataset.bound = 'true';

    document.getElementById('booking-redirect-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('booking-redirect-close')?.addEventListener('click', () => this.close());
    document.getElementById('booking-redirect-confirm')?.addEventListener('click', () => this.confirm());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) this.close();
    });
  },

  bindTriggers() {
    document.querySelectorAll('[data-booking-redirect]').forEach((el) => {
      if (el.dataset.bookingBound === 'true') return;
      el.dataset.bookingBound = 'true';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.open({
          type: el.dataset.bookingType || 'general',
          id: el.dataset.bookingId || '',
        });
      });
    });
  },
};

window.TapirBooking = TapirBooking;
