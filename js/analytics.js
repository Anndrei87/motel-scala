/**
 * Tapir LP — Analytics
 * Eventos de conversão para GA4 / GTM / Pixel.
 */

const TapirAnalytics = {
  config: null,

  init(config) {
    this.config = config?.analytics || {};
    this.loadGA4();
    this.loadGTM();
    this.trackScrollDepth();
  },

  loadGA4() {
    const id = this.config.googleAnalyticsId;
    if (!id) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  },

  loadGTM() {
    const id = this.config.googleTagManagerId;
    if (!id) return;

    const script = document.createElement('script');
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(script);
  },

  track(eventName, params = {}) {
    // GA4
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }

    // DataLayer (GTM)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });

    // Debug em dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Analytics]', eventName, params);
    }
  },

  trackScrollDepth() {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set();

    const onScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      thresholds.forEach((t) => {
        if (scrollPercent >= t && !fired.has(t)) {
          fired.add(t);
          this.track('scroll_depth', { depth: t });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  },
};

window.TapirAnalytics = TapirAnalytics;
