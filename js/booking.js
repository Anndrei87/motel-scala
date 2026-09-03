/**
 * Tapir LP — Card de reserva (UI customizada)
 */

const Booking = {
  config: null,
  state: {
    guests: 2,
    calendarMonth: new Date(),
    openField: null,
  },

  MONTHS: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],

  init(config) {
    this.config = config;
    const card = document.getElementById('booking-card');
    const bookingConfig = config.hero?.bookingCard;

    if (!card || bookingConfig?.enabled === false) {
      card?.classList.add('hidden');
      return;
    }

    card.classList.remove('hidden');
    this.state.guests = bookingConfig?.defaultGuests || 2;

    this.renderLabels(bookingConfig);
    this.renderRoomList(config.rooms);
    this.initGuests(bookingConfig);
    this.bindFields();
    this.bindForm(config);
    this.hideHeroCtas();
  },

  renderLabels(cfg) {
    const labels = cfg?.labels || {};
    const placeholders = cfg?.placeholders || {};
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && text) el.textContent = text;
    };

    set('booking-label-room', labels.roomType || 'Tipo de reserva');
    set('booking-label-checkin', labels.checkIn || 'Data de entrada');
    set('booking-label-checkout', labels.checkOut || 'Data de saída');
    set('booking-label-guests', labels.guests || 'Hóspedes');

    const roomDisplay = document.getElementById('booking-room-display');
    if (roomDisplay && placeholders.roomType) {
      roomDisplay.textContent = placeholders.roomType;
    }

    ['checkin', 'checkout'].forEach((key) => {
      const el = document.getElementById(`booking-${key}-display`);
      const ph = placeholders[key === 'checkin' ? 'checkIn' : 'checkOut'];
      if (el && ph) el.textContent = ph;
    });

    const submitText = document.getElementById('booking-submit-text');
    if (submitText) submitText.textContent = cfg?.ctaText || 'Consultar no WhatsApp';
  },

  bedIcon() {
    return `<svg class="booking-popover__item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
  },

  renderRoomList(rooms) {
    const list = document.getElementById('booking-room-list');
    if (!list) return;

    const placeholder = this.config.hero?.bookingCard?.roomTypePlaceholder || 'Selecione o quarto';
    const items = [];

    (rooms || []).forEach((room) => {
      const meta = room.priceFrom
        ? `A partir de R$ ${room.priceFrom.toFixed(2).replace('.', ',')}`
        : '';
      items.push({ value: room.name, label: room.name, meta });
    });

    if (this.config.hero?.bookingCard?.showAnyRoomOption !== false) {
      items.push({ value: 'Ainda não defini o quarto', label: 'Ainda não defini o quarto', meta: '' });
    }

    list.innerHTML = items.map((item) => `
      <li class="booking-popover__item" role="option" data-value="${item.value}">
        ${this.bedIcon()}
        <div>
          ${item.label}
          ${item.meta ? `<span class="booking-popover__item-meta">${item.meta}</span>` : ''}
        </div>
      </li>
    `).join('');

    list.querySelectorAll('.booking-popover__item').forEach((el) => {
      el.addEventListener('click', () => {
        const value = el.dataset.value;
        document.getElementById('booking-room').value = value;
        const display = document.getElementById('booking-room-display');
        display.textContent = value;
        display.classList.remove('is-placeholder');
        list.querySelectorAll('.booking-popover__item').forEach((i) => i.classList.remove('is-selected'));
        el.classList.add('is-selected');
        this.closeAll();
      });
    });
  },

  initGuests(cfg) {
    const max = cfg?.maxGuests || 6;
    const min = 1;
    const countEl = document.getElementById('booking-guests-count');
    const hidden = document.getElementById('booking-guests');
    const display = document.getElementById('booking-guests-display');
    const minus = document.getElementById('booking-guests-minus');
    const plus = document.getElementById('booking-guests-plus');

    const update = () => {
      countEl.textContent = this.state.guests;
      hidden.value = this.state.guests;
      display.textContent = this.state.guests === 1 ? '1 hóspede' : `${this.state.guests} hóspedes`;
      minus.disabled = this.state.guests <= min;
      plus.disabled = this.state.guests >= max;
    };

    minus?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.state.guests > min) { this.state.guests--; update(); }
    });

    plus?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.state.guests < max) { this.state.guests++; update(); }
    });

    update();
  },

  bindFields() {
    document.querySelectorAll('.booking-field').forEach((field) => {
      const trigger = field.querySelector('.booking-field__trigger');
      const type = field.dataset.bookingField;
      const popover = field.querySelector('.booking-popover');

      popover?.addEventListener('click', (e) => e.stopPropagation());

      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = field.classList.contains('is-open');
        this.closeAll();
        if (!isOpen) this.openField(field, type);
      });
    });

    document.addEventListener('click', () => this.closeAll());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
  },

  openField(field, type) {
    field.classList.add('is-open');
    field.querySelector('.booking-field__trigger')?.setAttribute('aria-expanded', 'true');
    this.state.openField = type;

    const popover = field.querySelector('.booking-popover');
    if (popover) popover.hidden = false;

    if (type === 'checkin' || type === 'checkout') {
      this.renderCalendar(type);
    }
  },

  closeAll() {
    document.querySelectorAll('.booking-field').forEach((field) => {
      field.classList.remove('is-open');
      field.querySelector('.booking-field__trigger')?.setAttribute('aria-expanded', 'false');
      const popover = field.querySelector('.booking-popover');
      if (popover) popover.hidden = true;
    });
    this.state.openField = null;
  },

  todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  formatDateBR(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  },

  formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  renderCalendar(type) {
    const popover = document.getElementById(`booking-popover-${type}`);
    if (!popover) return;

    const month = this.state.calendarMonth;
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const selected = document.getElementById(`booking-${type}`)?.value;
    const checkinVal = document.getElementById('booking-checkin')?.value;

    let minDate = this.todayISO();
    if (type === 'checkout' && checkinVal) {
      const d = new Date(checkinVal + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      minDate = d.toISOString().split('T')[0];
    }

    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const startPad = firstDay.getDay();
    const today = this.todayISO();

    let daysHTML = '';
    for (let i = 0; i < startPad; i++) {
      daysHTML += `<button type="button" class="booking-calendar__day is-empty" disabled></button>`;
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const iso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const disabled = iso < minDate;
      const isSelected = iso === selected;
      const isToday = iso === today;
      daysHTML += `<button type="button" class="booking-calendar__day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}" data-date="${iso}" ${disabled ? 'disabled' : ''}>${day}</button>`;
    }

    popover.innerHTML = `
      <div class="booking-calendar__header">
        <button type="button" class="booking-calendar__nav" data-dir="-1" aria-label="Mês anterior">‹</button>
        <span class="booking-calendar__month">${this.MONTHS[monthIdx]} ${year}</span>
        <button type="button" class="booking-calendar__nav" data-dir="1" aria-label="Próximo mês">›</button>
      </div>
      <div class="booking-calendar__weekdays">
        ${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => `<span class="booking-calendar__weekday">${d}</span>`).join('')}
      </div>
      <div class="booking-calendar__days">${daysHTML}</div>
    `;

    popover.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dir = Number(btn.dataset.dir);
        this.state.calendarMonth = new Date(year, monthIdx + dir, 1);
        this.renderCalendar(type);
      });
    });

    popover.querySelectorAll('.booking-calendar__day[data-date]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const iso = btn.dataset.date;
        document.getElementById(`booking-${type}`).value = iso;
        const display = document.getElementById(`booking-${type}-display`);
        display.textContent = this.formatDisplayDate(iso);
        display.classList.remove('is-placeholder');

        if (type === 'checkin') {
          const checkout = document.getElementById('booking-checkout');
          const checkoutDisplay = document.getElementById('booking-checkout-display');
          if (checkout?.value && checkout.value <= iso) {
            checkout.value = '';
            checkoutDisplay.textContent = this.config.hero?.bookingCard?.placeholders?.checkOut || 'Adicione uma data';
            checkoutDisplay.classList.add('is-placeholder');
          }
        }

        this.closeAll();
      });
    });
  },

  buildMessage(data) {
    const { whatsapp, hotel } = this.config;
    const template = whatsapp?.messages?.booking ||
      `Olá! Gostaria de fazer uma reserva no {{hotel.name}}:\n\n` +
      `📋 Quarto: {{booking.roomType}}\n` +
      `📅 Entrada: {{booking.checkIn}}\n` +
      `📅 Saída: {{booking.checkOut}}\n` +
      `👥 Hóspedes: {{booking.guests}}\n\n` +
      `Poderia confirmar disponibilidade e valores?`;

    return WhatsApp.interpolate(template, {
      hotel: { name: hotel?.name || '', city: hotel?.city || '' },
      booking: data,
    });
  },

  bindForm(config) {
    const form = document.getElementById('booking-card');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const roomType = document.getElementById('booking-room')?.value;
      const checkInRaw = document.getElementById('booking-checkin')?.value;
      const checkOutRaw = document.getElementById('booking-checkout')?.value;
      const guests = document.getElementById('booking-guests')?.value;

      if (!roomType) {
        this.openField(document.querySelector('[data-booking-field="room"]'), 'room');
        return;
      }
      if (!checkInRaw) {
        this.openField(document.querySelector('[data-booking-field="checkin"]'), 'checkin');
        return;
      }
      if (!checkOutRaw) {
        this.openField(document.querySelector('[data-booking-field="checkout"]'), 'checkout');
        return;
      }
      if (checkOutRaw <= checkInRaw) {
        alert('A data de saída deve ser posterior à data de entrada.');
        return;
      }

      const bookingData = {
        roomType,
        checkIn: this.formatDateBR(checkInRaw),
        checkOut: this.formatDateBR(checkOutRaw),
        guests: guests === '1' ? '1 hóspede' : `${guests} hóspedes`,
      };

      const number = config.whatsapp?.number || config.hotel?.whatsapp;
      const url = WhatsApp.buildUrl(number, this.buildMessage(bookingData));

      if (window.TapirAnalytics) {
        window.TapirAnalytics.track('whatsapp_click', { context: 'booking', ...bookingData });
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    });
  },

  hideHeroCtas() {
    const ctas = document.querySelector('.hero__ctas');
    if (ctas && this.config.hero?.bookingCard?.hideLegacyCtas !== false) {
      ctas.style.display = 'none';
    }
  },
};

window.Booking = Booking;
