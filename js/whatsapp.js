/**
 * Tapir LP — WhatsApp helpers
 * Gera links com mensagens contextuais para alta conversão.
 */

const WhatsApp = {
  /**
   * Substitui placeholders {{chave}} ou {{objeto.propriedade}} no template
   */
  interpolate(template, data) {
    if (!template) return '';
    return template.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const keys = path.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }
      return value !== undefined ? String(value) : '';
    });
  },

  /**
   * Monta URL wa.me com mensagem codificada
   */
  buildUrl(number, message) {
    const cleanNumber = String(number).replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  },

  /**
   * Retorna URL para contexto específico
   * @param {'hero'|'room'|'promotion'|'gastronomy'|'decoration'|'footer'|'general'|'float'|'sticky'|'header'} context
   * @param {object} extra - { room, promotion, decoration }
   */
  getLink(config, context, extra = {}) {
    const { whatsapp, hotel } = config;
    const number = whatsapp?.number || hotel?.whatsapp;

    const data = {
      hotel: {
        name: hotel?.name || '',
        city: hotel?.city || '',
        phone: hotel?.phone || '',
        checkIn: hotel?.checkIn || '',
        checkOut: hotel?.checkOut || '',
      },
      room: extra.room || {},
      promotion: extra.promotion || {},
      decoration: extra.decoration || {},
    };

    const contextMap = {
      hero: whatsapp?.messages?.hero,
      room: whatsapp?.messages?.room,
      promotion: whatsapp?.messages?.promotion,
      gastronomy: whatsapp?.messages?.gastronomy || whatsapp?.messages?.general,
      decoration: whatsapp?.messages?.decoration || whatsapp?.messages?.general,
      footer: whatsapp?.messages?.footer,
      general: whatsapp?.messages?.general,
      float: whatsapp?.messages?.general,
      sticky: whatsapp?.messages?.hero,
      header: whatsapp?.messages?.general,
    };

    const template = contextMap[context] || whatsapp?.messages?.general || 'Olá!';
    const message = this.interpolate(template, data);

    return this.buildUrl(number, message);
  },

  /**
   * Aplica href e tracking em elemento
   */
  bind(element, config, context, extra = {}) {
    if (!element) return;
    const url = this.getLink(config, context, extra);
    element.href = url;
    element.target = '_blank';
    element.rel = 'noopener noreferrer';
    element.addEventListener('click', () => {
      if (window.TapirAnalytics) {
        window.TapirAnalytics.track('whatsapp_click', { context, ...extra });
      }
    });
  },

  /**
   * Inicializa todos os botões WhatsApp da página
   */
  init(config) {
    if (!config?.whatsapp) return;

    // Botões com data-whatsapp-context
    document.querySelectorAll('[data-whatsapp-context]').forEach((el) => {
      const context = el.dataset.whatsappContext;
      const roomId = el.dataset.roomId;
      let extra = {};

      if (roomId && config.rooms) {
        extra.room = config.rooms.find((r) => r.id === roomId) || {};
      }

      const decorationId = el.dataset.decorationId;
      if (decorationId && config.decorations?.items) {
        extra.decoration = config.decorations.items.find((d) => d.id === decorationId) || {};
      }

      const promotionId = el.dataset.promotionId;
      if (promotionId && config.promotions?.items) {
        extra.promotion = config.promotions.items.find((p) => p.id === promotionId) || {};
      }

      this.bind(el, config, context, extra);
    });

    // Float button
    const float = document.getElementById('whatsapp-float');
    if (float && config.whatsapp.showFloatingButton) {
      float.classList.remove('hidden');
      const textEl = document.getElementById('whatsapp-float-text');
      if (textEl) textEl.textContent = config.whatsapp.floatingButtonText || 'WhatsApp';
      this.bind(float, config, 'float');
    } else if (float) {
      float.classList.add('hidden');
    }

    // Sticky bar
    const sticky = document.getElementById('sticky-whatsapp');
    if (sticky) {
      this.bind(sticky, config, 'sticky');
    }
  },
};

window.WhatsApp = WhatsApp;
