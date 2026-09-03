/**
 * Tapir LP — Render engine
 * Popula o template HTML a partir do JSON de configuração.
 */

const Render = {
  config: null,

  init(config) {
    this.config = config;
    this.applyTheme();
    this.applySEO();
    this.applySections();
    this.renderHeader();
    this.renderHero();
    this.renderTrustBar();
    this.renderRooms();
    this.renderAmenities();
    this.renderAbout();
    this.renderGastronomy();
    this.renderDecorations();
    this.renderGallery();
    this.renderPromotions();
    this.renderLocation();
    this.renderReviews();
    this.renderFAQ();
    this.renderCTAFinal();
    this.renderFooter();
    this.injectSchema();
  },

  interpolate(text) {
    if (!text) return '';
    const { hotel } = this.config;
    return text
      .replace(/\{\{hotel\.name\}\}/g, hotel.name || '')
      .replace(/\{\{hotel\.city\}\}/g, hotel.city || '')
      .replace(/\{\{hotel\.state\}\}/g, hotel.state || '')
      .replace(/\{\{hotel\.checkIn\}\}/g, hotel.checkIn || '')
      .replace(/\{\{hotel\.checkOut\}\}/g, hotel.checkOut || '');
  },

  loadGoogleFonts(heading, body) {
    const headingFont = (heading || 'Montserrat').trim();
    const bodyFont = (body || 'Montserrat').trim();

    const weights = headingFont === bodyFont
      ? '400;500;600;700'
      : null;

    const toParam = (name, w) =>
      `family=${name.replace(/\s+/g, '+')}:wght@${w}`;

    const href = weights
      ? `https://fonts.googleapis.com/css2?${toParam(headingFont, weights)}&display=swap`
      : [
          'https://fonts.googleapis.com/css2?',
          toParam(headingFont, '600;700'),
          '&',
          toParam(bodyFont, '400;500;600;700'),
          '&display=swap',
        ].join('');

    let link = document.getElementById('google-fonts');
    if (!link) {
      link = document.createElement('link');
      link.id = 'google-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  },

  applyTheme() {
    const { theme } = this.config;
    if (!theme) return;

    this.loadGoogleFonts(theme.fontHeading, theme.fontBody);

    const root = document.documentElement;
    const set = (prop, val) => val && root.style.setProperty(prop, val);

    set('--color-primary', theme.primary);
    set('--color-secondary', theme.secondary);
    set('--color-accent', theme.accent);
    set('--color-background', theme.background);
    set('--color-surface', theme.surface);
    set('--color-text', theme.text);
    set('--color-text-muted', theme.textMuted);
    set('--hero-overlay', theme.heroOverlay);
    set('--font-heading', `'${theme.fontHeading}', system-ui, sans-serif`);
    set('--font-body', `'${theme.fontBody}', system-ui, sans-serif`);

    // Darken primary for hover
    if (theme.primary) {
      root.style.setProperty('--color-primary-dark', this.darken(theme.primary, 15));
    }

    document.body.dataset.radius = theme.borderRadius || 'md';
    document.body.dataset.buttonStyle = theme.buttonStyle || 'pill';
    document.body.dataset.sectionBand = theme.sectionBand ? 'true' : 'false';
  },

  darken(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0xff) - percent);
    const b = Math.max(0, (num & 0xff) - percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },

  applySEO() {
    const { seo, hotel } = this.config;
    const title = this.interpolate(seo?.title || `${hotel.name} — Hotel em ${hotel.city}`);
    const description = this.interpolate(seo?.description || '');

    document.title = title;
    this.setMeta('description', description);
    this.setMeta('og:title', title, 'property');
    this.setMeta('og:description', description, 'property');
    if (seo?.ogImage) this.setMeta('og:image', seo.ogImage, 'property');

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && this.hasLogo(hotel.favicon)) favicon.href = hotel.favicon;

    document.documentElement.lang = this.config.meta?.language || 'pt-BR';
  },

  setMeta(name, content, attr = 'name') {
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (el) el.content = content;
  },

  applySections() {
    const { sections } = this.config;
    if (!sections) return;

    document.querySelectorAll('[data-section]').forEach((el) => {
      const key = el.dataset.section;
      const visible = sections[key] !== false;
      el.classList.toggle('is-visible', visible);
      if (!visible) el.setAttribute('aria-hidden', 'true');
    });
  },

  hasLogo(logo) {
    return typeof logo === 'string' && logo.trim().length > 0;
  },

  renderHeader() {
    const { hotel, navigation } = this.config;

    const logoImg = document.getElementById('header-logo');
    const logoText = document.getElementById('header-logo-text');
    const showLogo = this.hasLogo(hotel.logo);

    if (logoImg) {
      if (showLogo) {
        logoImg.src = hotel.logo;
        logoImg.alt = hotel.logoAlt || hotel.name;
        logoImg.style.display = '';
      } else {
        logoImg.style.display = 'none';
        logoImg.removeAttribute('src');
      }
    }
    if (logoText) {
      if (showLogo) {
        logoText.textContent = '';
        logoText.style.display = 'none';
        logoText.setAttribute('aria-hidden', 'true');
      } else {
        logoText.textContent = hotel.name;
        logoText.style.display = '';
        logoText.removeAttribute('aria-hidden');
      }
    }

    const nav = document.getElementById('header-nav');
    const mobileMenu = document.getElementById('mobile-menu');
    const navItems = (navigation || []).filter((n) => n.enabled !== false);

    const navHTML = navItems.map((n) => `<a href="${n.href}">${n.label}</a>`).join('');
    if (nav) nav.innerHTML = navHTML;
    if (mobileMenu) {
      mobileMenu.innerHTML = navHTML;
    }

    const headerWa = document.getElementById('header-whatsapp');
    if (headerWa) headerWa.textContent = 'WhatsApp';
  },

  renderHero() {
    const { hero, hotel } = this.config;

    const img = document.getElementById('hero-img');
    const imgMobile = document.getElementById('hero-img-mobile');
    if (img) {
      img.src = hero.image;
      img.alt = hotel.name;
    }
    if (imgMobile) imgMobile.srcset = hero.imageMobile || hero.image;

    document.getElementById('hero-title').textContent = this.interpolate(hero.title);
    document.getElementById('hero-subtitle').textContent = this.interpolate(hero.subtitle);

    const badges = document.getElementById('hero-badges');
    if (badges && hero.badges?.length) {
      badges.innerHTML = hero.badges.map((b) => `<span class="hero__badge">${b}</span>`).join('');
    }

    const cta = document.getElementById('hero-cta');
    if (cta) cta.textContent = hero.cta?.text || 'Consultar disponibilidade';

    const phoneCta = document.getElementById('hero-phone-cta');
    if (phoneCta && hotel.phone) {
      phoneCta.href = `tel:${hotel.phone.replace(/\D/g, '')}`;
      phoneCta.textContent = hotel.phone;
    } else if (phoneCta) {
      phoneCta.style.display = 'none';
    }
  },

  renderTrustBar() {
    const { trustBar } = this.config;
    const container = document.getElementById('trust-bar-content');
    if (!container || !trustBar?.enabled) return;

    const items = trustBar.highlights || [];
    container.innerHTML = items.map((item) => `
      <div class="trust-bar__item">
        <span class="trust-bar__icon">${Icons.get(item.icon)}</span>
        <span>${item.label}</span>
      </div>
    `).join('');
  },

  renderRooms() {
    const { rooms, roomsSection } = this.config;
    const grid = document.getElementById('rooms-grid');
    if (!grid || !rooms?.length) return;

    const titleEl = document.getElementById('rooms-title');
    const subtitleEl = document.getElementById('rooms-subtitle');
    if (titleEl && roomsSection?.title) titleEl.textContent = roomsSection.title;
    if (subtitleEl && roomsSection?.subtitle) subtitleEl.textContent = roomsSection.subtitle;

    grid.innerHTML = rooms.map((room) => {
      const photo = room.photos?.[0] || 'assets/images/placeholder-room.jpg';
      const priceHTML = room.priceFrom
        ? `<div class="room-card__price">
            <span class="room-card__price-label">${room.priceLabel || 'a partir de'}</span>
            R$ ${room.priceFrom.toFixed(2).replace('.', ',')}
          </div>`
        : `<div class="room-card__price-consult">${room.priceLabel || 'Consulte valores'}</div>`;

      const amenities = (room.amenities || []).slice(0, 5)
        .map((a) => `<span class="room-card__amenity">${a}</span>`).join('');

      const capacity = room.capacity
        ? `${room.capacity.adults} adulto(s)${room.capacity.children ? ` · ${room.capacity.children} criança(s)` : ''}`
        : '';

      const fallbackPhoto = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=500&fit=crop&q=80';

      return `
        <article class="room-card">
          <img src="${photo}" alt="${room.name}" class="room-card__image" loading="lazy"
               onerror="this.onerror=null;this.src='${fallbackPhoto}'">
          <div class="room-card__body">
            <h3 class="room-card__name">${room.name}</h3>
            <p class="room-card__desc">${room.description || ''}</p>
            <div class="room-card__meta">
              ${room.bedType ? `<span>${room.bedType}</span>` : ''}
              ${capacity ? `<span>${capacity}</span>` : ''}
              ${room.sizeM2 ? `<span>${room.sizeM2}m²</span>` : ''}
            </div>
            <div class="room-card__amenities">${amenities}</div>
            <div class="room-card__footer">
              ${priceHTML}
              <a href="#" class="btn btn--whatsapp btn--sm"
                 data-whatsapp-context="room"
                 data-room-id="${room.id}">
                ${room.ctaText || 'Reservar'}
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  renderAmenities() {
    const { amenities } = this.config;
    const grid = document.getElementById('amenities-grid');
    if (!grid) return;

    const enabled = (amenities || []).filter((a) => a.enabled !== false);
    grid.innerHTML = enabled.map((a) => `
      <div class="amenity-card">
        <div class="amenity-card__icon">${Icons.get(a.icon)}</div>
        <div class="amenity-card__label">${a.label}</div>
      </div>
    `).join('');
  },

  renderAbout() {
    const { about } = this.config;
    if (!about?.enabled) return;

    document.getElementById('about-title').textContent = this.interpolate(about.title || '');
    const textEl = document.getElementById('about-text');
    if (textEl) {
      textEl.innerHTML = about.text.split('\n').filter(Boolean)
        .map((p) => `<p>${p}</p>`).join('');
    }
    const img = document.getElementById('about-image');
    if (img && about.image) {
      img.src = about.image;
      img.alt = about.title || '';
    }
  },

  renderGastronomy() {
    const { gastronomy } = this.config;
    const section = document.getElementById('gastronomia');
    if (!gastronomy?.enabled) {
      section?.classList.remove('is-visible');
      return;
    }
    section?.classList.add('is-visible');

    const title = document.getElementById('gastronomy-title');
    const subtitle = document.getElementById('gastronomy-subtitle');
    if (title) title.textContent = gastronomy.title || 'Gastronomia';
    if (subtitle) subtitle.textContent = gastronomy.subtitle || '';

    const feature = document.getElementById('gastronomy-feature');
    if (feature) {
      feature.innerHTML = `
        <div class="gastronomy-feature__media">
          <img src="${gastronomy.image || ''}" alt="${gastronomy.title || 'Gastronomia'}" loading="lazy">
        </div>
        <div class="gastronomy-feature__content">
          <p>${gastronomy.description || ''}</p>
          <a href="#" class="btn btn--whatsapp" data-whatsapp-context="gastronomy">
            ${gastronomy.ctaText || 'Ver cardápio no WhatsApp'}
          </a>
        </div>
      `;
    }

    const grid = document.getElementById('gastronomy-grid');
    if (!grid) return;
    grid.innerHTML = (gastronomy.items || []).map((item) => `
      <article class="gastro-card">
        <img src="${item.image}" alt="${item.name}" class="gastro-card__image" loading="lazy">
        <div class="gastro-card__body">
          ${item.badge ? `<span class="gastro-card__badge">${item.badge}</span>` : ''}
          <h3 class="gastro-card__name">${item.name}</h3>
        </div>
      </article>
    `).join('');
  },

  renderDecorations() {
    const { decorations } = this.config;
    const section = document.getElementById('decoracoes');
    if (!decorations?.enabled) {
      section?.classList.remove('is-visible');
      return;
    }
    section?.classList.add('is-visible');

    const title = document.getElementById('decorations-title');
    const subtitle = document.getElementById('decorations-subtitle');
    const desc = document.getElementById('decorations-description');
    if (title) title.textContent = decorations.title || 'Decorações';
    if (subtitle) subtitle.textContent = decorations.subtitle || '';
    if (desc) desc.textContent = decorations.description || '';

    const grid = document.getElementById('decorations-grid');
    if (!grid) return;

    grid.innerHTML = (decorations.items || []).map((item) => {
      const price = item.priceFrom != null
        ? `<div class="decoration-card__price">R$ ${Number(item.priceFrom).toFixed(2).replace('.', ',')}</div>`
        : '';
      return `
        <article class="decoration-card">
          <img src="${item.image}" alt="${item.name}" class="decoration-card__image" loading="lazy">
          <div class="decoration-card__body">
            <h3 class="decoration-card__name">${item.name}</h3>
            <p class="decoration-card__desc">${item.description || ''}</p>
            <div class="decoration-card__footer">
              ${price}
              <a href="#" class="btn btn--whatsapp btn--sm"
                 data-whatsapp-context="decoration"
                 data-decoration-id="${item.id}">
                ${item.ctaText || 'Reservar'}
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  renderGallery() {
    const { gallery } = this.config;
    const grid = document.getElementById('gallery-grid');
    if (!grid || !gallery?.enabled) return;

    document.getElementById('gallery-title').textContent = gallery.title || 'Galeria';

    const fallback = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop&q=80';

    grid.innerHTML = (gallery.images || []).map((img, i) => `
      <div class="gallery__item" data-gallery-index="${i}">
        <img src="${img.src}" alt="${img.alt || ''}" loading="lazy"
             onerror="this.onerror=null;this.src='${fallback}'">
      </div>
    `).join('');
  },

  renderPromotions() {
    const { promotions } = this.config;
    const grid = document.getElementById('promotions-grid');
    if (!grid || !promotions?.enabled) return;

    const titleEl = document.getElementById('promotions-title');
    if (titleEl && promotions.title) titleEl.textContent = promotions.title;

    const items = (promotions.items || []).filter((p) => p.enabled !== false);
    grid.innerHTML = items.map((promo) => `
      <div class="promotion-card">
        ${promo.discount ? `<div class="promotion-card__discount">${promo.discount} OFF</div>` : ''}
        <h3>${promo.title}</h3>
        <p>${promo.description || ''}</p>
        ${promo.validUntil ? `<small>Válido até ${promo.validUntil}</small>` : ''}
        <a href="#" class="btn btn--whatsapp"
           data-whatsapp-context="promotion"
           data-promotion-id="${promo.id}">
          Aproveitar promoção
        </a>
      </div>
    `).join('');
  },

  renderLocation() {
    const { location, hotel } = this.config;
    if (!location?.enabled) return;

    document.getElementById('location-title').textContent = location.title || 'Localização';
    document.getElementById('location-description').textContent =
      this.interpolate(location.description || '');

    document.getElementById('location-address').innerHTML = `
      <strong>${hotel.name}</strong><br>
      ${hotel.address}<br>
      ${hotel.neighborhood ? `${hotel.neighborhood}, ` : ''}${hotel.city} - ${hotel.state}
      ${hotel.zipCode ? `<br>CEP: ${hotel.zipCode}` : ''}
    `;

    const nearby = document.getElementById('location-nearby');
    if (nearby && location.nearby?.length) {
      nearby.innerHTML = location.nearby.map((p) => `
        <li><span>${p.name}</span><span>${p.distance}</span></li>
      `).join('');
    }

    const directions = document.getElementById('location-directions');
    if (directions) {
      directions.href = location.googleMapsUrl ||
        `https://maps.google.com/?q=${encodeURIComponent(hotel.address + ', ' + hotel.city)}`;
    }

    const uberBtn = document.getElementById('location-uber');
    if (uberBtn) {
      const showUber = location.uber?.enabled === true || Boolean(location.uberUrl);

      if (showUber) {
        const address = [
          hotel.address,
          hotel.neighborhood,
          hotel.city,
          hotel.state,
        ].filter(Boolean).join(', ');

        uberBtn.href = location.uberUrl || this.buildUberUrl({
          lat: location.lat,
          lng: location.lng,
          name: hotel.name,
          address: location.uber?.address || address,
        });
        uberBtn.textContent = location.uber?.label || 'Ir de Uber';
        uberBtn.classList.remove('hidden');
      } else {
        uberBtn.classList.add('hidden');
      }
    }

    const mapEl = document.getElementById('location-map');
    if (mapEl && location.lat && location.lng) {
      mapEl.innerHTML = `
        <iframe
          src="https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Mapa - ${hotel.name}">
        </iframe>
      `;
    }
  },

  buildUberUrl({ lat, lng, name, address }) {
    const params = new URLSearchParams();
    params.set('action', 'setPickup');
    params.set('pickup', 'my_location');
    if (lat != null && lng != null) {
      params.set('dropoff[latitude]', String(lat));
      params.set('dropoff[longitude]', String(lng));
    }
    if (name) params.set('dropoff[nickname]', name);
    if (address) params.set('dropoff[formatted_address]', address);
    return `https://m.uber.com/ul/?${params.toString()}`;
  },

  renderReviews() {
    const { reviews } = this.config;
    const grid = document.getElementById('reviews-grid');
    if (!grid || !reviews?.enabled) return;

    document.getElementById('reviews-title').textContent = reviews.title || 'Avaliações';

    grid.innerHTML = (reviews.items || []).map((r) => `
      <div class="review-card">
        <div class="review-card__stars">${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))}</div>
        <p class="review-card__text">"${r.text}"</p>
        <div class="review-card__author">— ${r.author}</div>
      </div>
    `).join('');
  },

  renderFAQ() {
    const { faq } = this.config;
    const list = document.getElementById('faq-list');
    if (!list || !faq?.enabled) return;

    document.getElementById('faq-title').textContent = faq.title || 'Perguntas frequentes';

    list.innerHTML = (faq.items || []).map((item, i) => `
      <div class="faq__item" data-faq-index="${i}">
        <button class="faq__question" aria-expanded="false">${this.interpolate(item.question)}</button>
        <div class="faq__answer"><p>${this.interpolate(item.answer)}</p></div>
      </div>
    `).join('');
  },

  renderCTAFinal() {
    const { ctaFinal, hotel } = this.config;
    if (!ctaFinal?.enabled) return;

    document.getElementById('cta-final-title').textContent = ctaFinal.title || '';
    document.getElementById('cta-final-subtitle').textContent = ctaFinal.subtitle || '';

    const bg = document.getElementById('cta-final-bg');
    if (bg && ctaFinal.backgroundImage) bg.src = ctaFinal.backgroundImage;

    const wa = document.getElementById('cta-final-whatsapp');
    if (wa) wa.textContent = ctaFinal.primaryCta || 'Falar no WhatsApp';

    const phone = document.getElementById('cta-final-phone');
    if (phone && ctaFinal.showPhone && hotel.phone) {
      phone.href = `tel:${hotel.phone.replace(/\D/g, '')}`;
      phone.textContent = `Ligar: ${hotel.phone}`;
    } else if (phone) {
      phone.style.display = 'none';
    }
  },

  renderFooter() {
    const { hotel } = this.config;

    const logo = document.getElementById('footer-logo');
    if (logo) {
      if (this.hasLogo(hotel.logo)) {
        logo.src = hotel.logo;
        logo.alt = hotel.name;
        logo.style.display = '';
      } else {
        logo.style.display = 'none';
        logo.removeAttribute('src');
      }
    }

    document.getElementById('footer-tagline').textContent = hotel.tagline || '';
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    document.getElementById('footer-name').textContent = hotel.name;

    const contact = document.getElementById('footer-contact');
    if (contact) {
      contact.innerHTML = `
        ${hotel.address ? `<li>${hotel.address}, ${hotel.city} - ${hotel.state}</li>` : ''}
        ${hotel.phone ? `<li><a href="tel:${hotel.phone.replace(/\D/g, '')}">${hotel.phone}</a></li>` : ''}
        ${hotel.email ? `<li><a href="mailto:${hotel.email}">${hotel.email}</a></li>` : ''}
      `;
    }

    const hours = document.getElementById('footer-hours');
    if (hours) {
      hours.innerHTML = `
        <li>Check-in: ${hotel.checkIn || '14:00'}</li>
        <li>Check-out: ${hotel.checkOut || '12:00'}</li>
        <li>Recepção: ${hotel.receptionHours || '24 horas'}</li>
      `;
    }

    const social = document.getElementById('footer-social');
    const socialWrap = document.getElementById('footer-social-wrap');
    const links = [];
    if (hotel.instagram) links.push(`<a href="${hotel.instagram}" target="_blank" rel="noopener">Instagram</a>`);
    if (hotel.facebook) links.push(`<a href="${hotel.facebook}" target="_blank" rel="noopener">Facebook</a>`);

    if (social && links.length) {
      social.innerHTML = links.join('');
    } else if (socialWrap) {
      socialWrap.style.display = 'none';
    }
  },

  injectSchema() {
    const { hotel, seo, location, rooms } = this.config;
    const prices = (rooms || []).map((r) => r.priceFrom).filter(Boolean);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: hotel.name,
      description: this.interpolate(seo?.description || ''),
      image: seo?.ogImage || hotel.logo,
      address: {
        '@type': 'PostalAddress',
        streetAddress: hotel.address,
        addressLocality: hotel.city,
        addressRegion: hotel.state,
        postalCode: hotel.zipCode || '',
        addressCountry: 'BR',
      },
      telephone: hotel.phone,
      url: seo?.canonicalUrl || window.location.href,
      ...(location?.lat && location?.lng && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
      ...(minPrice && {
        priceRange: maxPrice && maxPrice !== minPrice
          ? `R$${minPrice}-R$${maxPrice}`
          : `R$${minPrice}+`,
      }),
      checkinTime: hotel.checkIn,
      checkoutTime: hotel.checkOut,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  },
};

window.Render = Render;
