/**
 * Tapir LP — Card chamativo do hero (CTA para booking / WhatsApp)
 */

const Booking = {
  config: null,

  init(config) {
    this.config = config;
    const card = document.getElementById('hero-cta-card');
    const ctaConfig = config.hero?.ctaCard;

    // Compat: bookingCard.enabled false desliga; ctaCard é o novo padrão
    const legacy = config.hero?.bookingCard;
    const enabled = ctaConfig?.enabled !== false && legacy?.enabled !== false;

    if (!card || !enabled) {
      card?.classList.add('hidden');
      return;
    }

    card.classList.remove('hidden');
    this.renderCopy(ctaConfig, legacy);
    this.bindButton(config);
    this.hideHeroCtas(ctaConfig, legacy);
  },

  renderCopy(ctaConfig = {}, legacy = {}) {
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && text != null) el.textContent = text;
    };

    const usesBooking = window.TapirBooking?.usesExternalBooking(this.config);
    const defaults = usesBooking
      ? {
          eyebrow: 'Reserve agora',
          title: 'Garanta sua suíte no Tapir Booking',
          subtitle: 'Escolha a acomodação, finalize a reserva e pague com segurança.',
          buttonText: 'Reservar agora',
        }
      : {
          eyebrow: 'Disponibilidade rápida',
          title: 'Reserve pelo WhatsApp',
          subtitle: 'Fale com a recepção e garanta sua estadia em poucos minutos.',
          buttonText: 'Consultar no WhatsApp',
        };

    set('hero-cta-eyebrow', ctaConfig.eyebrow || defaults.eyebrow);
    set('hero-cta-title', ctaConfig.title || defaults.title);
    set('hero-cta-subtitle', ctaConfig.subtitle || defaults.subtitle);

    const btn = document.getElementById('hero-cta-button');
    if (btn) {
      btn.textContent = ctaConfig.buttonText || legacy.ctaText || defaults.buttonText;
      btn.classList.toggle('btn--booking', usesBooking);
      btn.classList.toggle('btn--whatsapp', !usesBooking);
    }
  },

  bindButton(config) {
    const btn = document.getElementById('hero-cta-button');
    if (!btn || btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (window.TapirBooking?.usesExternalBooking(config)) {
        window.TapirBooking.open({ type: 'hero', id: 'cta-card' });
        return;
      }

      const url = WhatsApp.getLink(config, 'hero');
      if (window.TapirAnalytics) {
        window.TapirAnalytics.track('whatsapp_click', { context: 'hero-cta-card' });
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  },

  hideHeroCtas(ctaConfig = {}, legacy = {}) {
    const hide = ctaConfig.hideLegacyCtas !== false && legacy.hideLegacyCtas !== false;
    const ctas = document.querySelector('.hero__ctas');
    if (ctas && hide) ctas.style.display = 'none';
  },
};

window.Booking = Booking;
