(function () {
  function money(value) {
    return `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function shortCode(place) {
    const clean = String(place || '')
      .replace(/\(.*?\)/g, '')
      .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ' ')
      .trim();
    if (!clean) return '---';
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0][0] || ''}${words[1][0] || ''}${words[2]?.[0] || ''}`.toUpperCase();
    return clean.slice(0, 3).toUpperCase();
  }

  function formatDate(isoDate) {
    if (!isoDate) return '-';
    const d = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getFlightCost(order) {
    const totals = order?.totals || {};
    const base = Number(totals.base || 0);
    if (base > 0) return base;

    const outbound = Number(order?.selectedOutbound?.price || 0);
    const incoming = Number(order?.selectedReturn?.price || 0);
    return Math.max(outbound + incoming, 0);
  }

  function getAddonsRows(order) {
    const rows = [];
    const selectedAddons = Array.isArray(order?.selectedAddons) ? order.selectedAddons : [];

    selectedAddons.forEach((addon) => {
      const value = Number(addon?.price || 0);
      if (value <= 0) return;
      rows.push({ label: addon?.name || 'Servicio adicional', value });
    });

    const seats = Number(order?.totals?.seats || 0);
    if (seats > 0) rows.push({ label: 'Asientos', value: seats });

    const protection = Number(order?.totals?.protection || 0);
    if (protection > 0) rows.push({ label: order?.protection?.label || 'Protección de viaje', value: protection });

    if (!rows.length) {
      rows.push({ label: 'Sin cargos adicionales', value: 0 });
    }

    return rows;
  }

  function getTuaRows(order) {
    const tua = Number(order?.totals?.tua || 0);
    if (tua <= 0) {
      return [{ label: 'TUA', value: 0 }];
    }

    const origin = shortCode(order?.search?.origin);
    const destination = shortCode(order?.search?.destination);
    if (order?.roundTrip) {
      const half = tua / 2;
      return [
        { label: `TUA ${origin}`, value: half },
        { label: `TUA ${destination}`, value: tua - half },
      ];
    }

    return [{ label: `TUA ${destination}`, value: tua }];
  }

  function renderPaymentCartSummary(options) {
    const root = options?.root;
    const order = options?.order;
    if (!root || !order) return;

    const origin = order?.search?.origin || 'Origen';
    const destination = order?.search?.destination || 'Destino';
    const passengers = Number(order?.passengers || 1);
    const outboundMeta = `${formatDate(order?.search?.departDate)} · ${passengers} ${passengers === 1 ? 'pasajero' : 'pasajeros'}`;
    const returnMeta = `${formatDate(order?.search?.returnDate)} · ${passengers} ${passengers === 1 ? 'pasajero' : 'pasajeros'}`;

    const trips = [
      {
        route: `${origin} - ${destination}`,
        meta: outboundMeta,
      },
    ];

    if (order?.roundTrip) {
      trips.push({
        route: `${destination} - ${origin}`,
        meta: returnMeta,
      });
    }

    const tuaRows = getTuaRows(order);
    const addonsRows = getAddonsRows(order);
    const flightCost = getFlightCost(order);
    const total = Number(options?.totalOverride ?? order?.totals?.final ?? order?.totals?.payable ?? order?.totals?.grand ?? 0);

    root.innerHTML = `
      <section class="payment-cart-summary">
        <h3 class="payment-cart-summary__title">Carrito de compra</h3>

        <div class="payment-cart-summary__section">
          <h4 class="payment-cart-summary__section-title">Resumen de trayectos</h4>
          ${trips.map((trip) => `
            <article class="payment-cart-summary__trip">
              <p class="payment-cart-summary__trip-route">${trip.route}</p>
              <p class="payment-cart-summary__trip-meta">${trip.meta}</p>
            </article>
          `).join('')}
          <div class="payment-cart-summary__row">
            <p class="payment-cart-summary__label">Costo del vuelo</p>
            <p class="payment-cart-summary__value">${money(flightCost)}</p>
          </div>
        </div>

        <div class="payment-cart-summary__bar">Tarifa de Uso de Aeropuerto</div>
        <div class="payment-cart-summary__section payment-cart-summary__section--soft">
          ${tuaRows.map((row) => `
            <div class="payment-cart-summary__row">
              <p class="payment-cart-summary__label">${row.label}</p>
              <p class="payment-cart-summary__value">${money(row.value)}</p>
            </div>
          `).join('')}
        </div>

        <div class="payment-cart-summary__bar">Otros cargos</div>
        <div class="payment-cart-summary__section payment-cart-summary__section--soft">
          ${addonsRows.map((row) => `
            <div class="payment-cart-summary__row">
              <p class="payment-cart-summary__label">${row.label}</p>
              <p class="payment-cart-summary__value">${money(row.value)}</p>
            </div>
          `).join('')}
        </div>

        <div class="payment-cart-summary__total-box">
          <div class="payment-cart-summary__total-row">
            <span class="payment-cart-summary__total-label">Total</span>
            <span class="payment-cart-summary__total-value">${money(total)}</span>
          </div>
          <div class="payment-cart-summary__note">Impuestos y cargos incluidos</div>
        </div>

        <div class="payment-cart-summary__banner">Cambia a Switch o Smart y pago hasta en 14 MSI</div>
      </section>
    `;
  }

  window.renderPaymentCartSummary = renderPaymentCartSummary;
})();
