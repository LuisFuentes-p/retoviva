(function () {
  const FALLBACK_DESTINATIONS = [
    { name: "Monterrey", country: "México", type: "nacional", popular: true, latitude: 25.7785, longitude: -100.1069, accessMode: "intermodal", busProfitable: true },
    { name: "Ciudad de México (AICM)", country: "México", type: "nacional", popular: true, latitude: 19.4361, longitude: -99.0719, accessMode: "intermodal", busProfitable: true },
    { name: "Ciudad de México (AIFA)", country: "México", type: "nacional", popular: true, latitude: 19.7363, longitude: -99.0133, accessMode: "intermodal", busProfitable: true },
    { name: "Cancún", country: "México", type: "nacional", popular: true, latitude: 21.0365, longitude: -86.8771, accessMode: "intermodal", busProfitable: true },
    { name: "Guadalajara", country: "México", type: "nacional", popular: true, latitude: 20.5218, longitude: -103.3112, accessMode: "intermodal", busProfitable: true },
    { name: "Tijuana", country: "México", type: "nacional", popular: true, latitude: 32.5411, longitude: -116.9701, accessMode: "air_only", busProfitable: false },
    { name: "Mérida", country: "México", type: "nacional", popular: true, latitude: 20.937, longitude: -89.6577, accessMode: "air_only", busProfitable: false },
    { name: "Puerto Vallarta", country: "México", type: "nacional", popular: true, latitude: 20.6801, longitude: -105.2542, accessMode: "air_only", busProfitable: false },
    { name: "Austin", country: "EUA", type: "internacional", popular: true, latitude: 30.1975, longitude: -97.6664, accessMode: "air_only", busProfitable: false },
    { name: "Chicago", country: "EUA", type: "internacional", popular: true, latitude: 41.9742, longitude: -87.9073, accessMode: "air_only", busProfitable: false },
    { name: "Houston", country: "EUA", type: "internacional", popular: true, latitude: 29.9902, longitude: -95.3368, accessMode: "air_only", busProfitable: false },
    { name: "Las Vegas", country: "EUA", type: "internacional", popular: true, latitude: 36.084, longitude: -115.1537, accessMode: "air_only", busProfitable: false },
    { name: "Miami", country: "EUA", type: "internacional", popular: true, latitude: 25.7959, longitude: -80.287, accessMode: "air_only", busProfitable: false },
  ];

  const state = {
    search: {
      origin: "",
      destination: "",
      departDate: "",
      returnDate: "",
      passengers: "1",
    },
    allDestinations: [],
    selectedOutbound: null,
    selectedReturn: null,
    groundService: "none",
    groundOption: "none",
    collapsedLists: {
      outbound: false,
      return: false,
    },
  };

  const intermodalCatalog = {
    none: { label: "Sin intermodal", price: 0 },
    transfer: { label: "Viva Transfer", baseLabel: "Viva Transfer", price: 320, option: "default" },
    bus: { label: "Viva Bus", baseLabel: "Viva Bus", price: 240, option: "default" },
  };

  const ICONS = {
    plane: "../assets/img/avion-despegando.png",
    bus: "../assets/img/autobus.png",
  };

  function parseSearchData() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = {
      origin: params.get("origin") || "",
      destination: params.get("destination") || "",
      departDate: params.get("departDate") || "",
      returnDate: params.get("returnDate") || "",
      passengers: params.get("passengers") || "",
    };

    if (fromQuery.origin && fromQuery.destination) {
      return { ...fromQuery, passengers: fromQuery.passengers || "1" };
    }

    try {
      const raw = sessionStorage.getItem("flightSearch");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        origin: parsed.origin || "",
        destination: parsed.destination || "",
        departDate: parsed.departDate || "",
        returnDate: parsed.returnDate || "",
        passengers: parsed.passengers || "1",
      };
    } catch (error) {
      return null;
    }
  }

  function toDropdownItem(destination) {
    const prefix = destination.type === "internacional" ? `${destination.name}, ${destination.country}` : destination.name;
    return {
      label: destination.popular ? `${prefix} · Popular` : prefix,
      searchText: `${destination.name} ${destination.country} ${destination.type}`,
      value: destination.name,
      meta: destination,
    };
  }

  function getDestinationByName(name) {
    return state.allDestinations.find((destination) => destination.name === name) || null;
  }

  function formatAccessBadge(mode, place, busProfitable) {
    if (mode === "bus_only") {
      return {
        html: `${place}: <img src="${ICONS.bus}" alt="Bus" class="inline-icon" /> Solo autobús${busProfitable ? " · rentable" : ""}`,
        className: "bus-only",
      };
    }

    if (mode === "intermodal") {
      return {
        html: `${place}: <img src="${ICONS.plane}" alt="Avión" class="inline-icon" /> + <img src="${ICONS.bus}" alt="Bus" class="inline-icon" /> Intermodal${busProfitable ? " · rentable" : ""}`,
        className: "intermodal",
      };
    }

    return {
      html: `${place}: <img src="${ICONS.plane}" alt="Avión" class="inline-icon" /> Solo avión`,
      className: "air-only",
    };
  }

  function iconMarkup(mode) {
    const src = mode === "bus" ? ICONS.bus : ICONS.plane;
    const alt = mode === "bus" ? "Bus" : "Avión";
    return `<img src="${src}" alt="${alt}" class="inline-icon" />`;
  }

  function stringHash(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some((value) => typeof value !== "number" || Number.isNaN(value))) {
      return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} h ${String(mins).padStart(2, "0")} min`;
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function fromIsoDate(value) {
    if (!value) return new Date();
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  }

  function addDays(isoDate, offset) {
    const date = fromIsoDate(isoDate);
    date.setDate(date.getDate() + offset);
    return toIsoDate(date);
  }

  function diffDays(startIso, endIso) {
    if (!startIso || !endIso) return 0;
    const start = fromIsoDate(startIso);
    const end = fromIsoDate(endIso);
    const ms = end.getTime() - start.getTime();
    return Math.round(ms / 86400000);
  }

  function formatShortDate(isoDate) {
    const date = fromIsoDate(isoDate);
    return date.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
  }

  function normalizeCity(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function shortCode(value) {
    if (!value) return "---";
    const clean = value
      .replace(/\(.*?\)/g, "")
      .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, " ")
      .trim();

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] || ""}${words[1][0] || ""}${(words[2]?.[0] || "")}`.toUpperCase();
    }

    return clean.slice(0, 3).toUpperCase();
  }

  function renderTrajectoryLine(points) {
    if (!Array.isArray(points) || points.length < 2) return "";

    const start = points[0];
    const end = points[points.length - 1];
    const segments = points
      .slice(1)
      .map((point) => `${iconMarkup(point.icon)} ${point.duration}`)
      .join(" <span class=\"trajectory-dot\">·</span> ");

    return `
      <div class="trajectory-line">
        <span class="trajectory-point">${shortCode(start.place)}</span>
        <span class="trajectory-segment">${segments}</span>
        <span class="trajectory-point">${shortCode(end.place)}</span>
      </div>
    `;
  }

  function buildNormalRouteSegments(flight) {
    return [
      { place: flight.from },
      { place: flight.to, icon: "plane", duration: flight.duration },
    ];
  }

  function buildIntermodalRouteSegments(flight, originMeta, destinationMeta) {
    const segments = [{ place: flight.from }];

    if (originMeta?.accessMode === "bus_only") {
      segments.push({ place: "AICM", icon: "bus", duration: "4 h camión" });
    } else if (originMeta?.accessMode === "intermodal") {
      segments.push({ place: "Aeropuerto conexión", icon: "bus", duration: "1 h 20 min" });
    }

    const hopEnd = destinationMeta?.accessMode === "bus_only" ? "Aeropuerto cercano" : flight.to;
    segments.push({ place: hopEnd, icon: "plane", duration: flight.duration });

    if (destinationMeta?.accessMode === "bus_only") {
      segments.push({ place: flight.to, icon: "bus", duration: "2 h 30 min" });
    } else if (destinationMeta?.accessMode === "intermodal" && hopEnd !== flight.to) {
      segments.push({ place: flight.to, icon: "bus", duration: "1 h" });
    }

    return segments;
  }

  function isCdmxCancunRoute(origin, destination) {
    const a = normalizeCity(origin);
    const b = normalizeCity(destination);

    const cdmxAliases = ["cdmx", "ciudad de mexico", "aicm", "aifa"];
    const hasCdmx = cdmxAliases.some((alias) => a.includes(alias)) || cdmxAliases.some((alias) => b.includes(alias));
    const hasCancun = a.includes("cancun") || b.includes("cancun");

    return hasCdmx && hasCancun;
  }

  function buildFlight(direction, index, overrideDates = {}) {
    const { origin, destination, departDate, returnDate } = state.search;
    const seedDepart = overrideDates.departDate || departDate;
    const seedReturn = overrideDates.returnDate || returnDate;
    const key = `${origin}-${destination}-${seedDepart}-${seedReturn}-${direction}-${index}`;
    const baseSeed = stringHash(key);

    const routeFrom = direction === "outbound" ? origin : destination;
    const routeTo = direction === "outbound" ? destination : origin;

    const fromMeta = getDestinationByName(routeFrom) || {};
    const toMeta = getDestinationByName(routeTo) || {};
    const distanceKm = haversineKm(fromMeta.latitude, fromMeta.longitude, toMeta.latitude, toMeta.longitude);
    const isInternationalRoute = fromMeta.type === "internacional" || toMeta.type === "internacional";

    const depHour = 5 + Math.floor(seededRandom(baseSeed + 11) * 15);
    const depMin = Math.floor(seededRandom(baseSeed + 17) * 60);
    const inferredDuration = distanceKm ? clamp(Math.round(distanceKm / 11) + 55, 75, 420) : null;
    const durationMin = inferredDuration || (135 + Math.floor(seededRandom(baseSeed + 31) * 120));
    const arrTotal = depHour * 60 + depMin + durationMin;
    const arrHour = Math.floor((arrTotal % (24 * 60)) / 60);
    const arrMin = arrTotal % 60;

    const demandFactor = 0.9 + seededRandom(baseSeed + 37) * 0.25;
    const jitter = 0.92 + seededRandom(baseSeed + 41) * 0.16;

    const fallbackDistance = isInternationalRoute ? 2500 : 950;
    const pricingDistance = distanceKm || fallbackDistance;

    let baseFare;
    let tua;

    if (isInternationalRoute) {
      baseFare = Math.round(pricingDistance * 1.55 * demandFactor * jitter);
      baseFare = clamp(baseFare, 1800, 5600);
      tua = Math.round((760 + seededRandom(baseSeed + 53) * 280) * demandFactor);
      tua = clamp(tua, 680, 1200);
    } else {
      baseFare = Math.round(pricingDistance * 0.95 * demandFactor * jitter);
      baseFare = clamp(baseFare, 520, 2400);
      tua = Math.round((520 + seededRandom(baseSeed + 53) * 180) * demandFactor);
      tua = clamp(tua, 420, 760);
    }

    return {
      id: `${direction}-${index}`,
      airline: index % 2 === 0 ? "Viva Aerobus" : "Viva Mix",
      from: routeFrom,
      to: routeTo,
      departTime: `${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`,
      arriveTime: `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`,
      duration: formatDuration(durationMin),
      base: baseFare,
      tua,
      total: baseFare + tua,
      number: `VB${1000 + Math.floor(seededRandom(baseSeed + 7) * 7000)}`,
    };
  }

  function buildFlights(direction, overrideDates = {}) {
    const flights = [];

    for (let index = 0; index < 5; index += 1) {
      flights.push(buildFlight(direction, index, overrideDates));
    }

    if (isCdmxCancunRoute(state.search.origin, state.search.destination)) {
      const fixedFlight = {
        id: `${direction}-fixed-cdmx-cun`,
        airline: "Viva Aerobus",
        from: direction === "outbound" ? state.search.origin : state.search.destination,
        to: direction === "outbound" ? state.search.destination : state.search.origin,
        departTime: direction === "outbound" ? "08:00" : "19:10",
        arriveTime: direction === "outbound" ? "11:00" : "22:10",
        duration: "3 h 00 min",
        base: 1000,
        tua: 600,
        total: 1600,
        number: direction === "outbound" ? "VB2026" : "VB2027",
      };
      flights.unshift(fixedFlight);
    }

    return flights;
  }

  function renderFlightList(targetId, flights, direction) {
    const root = document.getElementById(targetId);
    if (!root) return;

    root.innerHTML = "";

    flights.forEach((flight) => {
      const isActive = direction === "outbound"
        ? state.selectedOutbound && state.selectedOutbound.id === flight.id
        : state.selectedReturn && state.selectedReturn.id === flight.id;

      const item = document.createElement("article");
      item.className = "flight-item";
      item.innerHTML = `
        <div class="flight-top">
          <div>
            <strong>${flight.airline} · ${flight.number}</strong>
            <p class="flight-route">${flight.from} → ${flight.to}</p>
            ${renderTrajectoryLine(buildNormalRouteSegments(flight))}
          </div>
          <div class="flight-price">
            <strong>$${flight.total}</strong>
            <p>MXN por pasajero</p>
          </div>
        </div>
        <div class="flight-meta">
          <span>Salida: ${flight.departTime}</span>
          <span>Llegada: ${flight.arriveTime}</span>
          <span>Duración: ${flight.duration}</span>
          <span>Tarifa: $${flight.base} + TUA $${flight.tua}</span>
        </div>
        <button type="button" class="select-flight-btn ${isActive ? "active" : ""}">
          ${isActive ? "Seleccionado" : "Seleccionar vuelo"}
        </button>
      `;

      item.querySelector(".select-flight-btn")?.addEventListener("click", () => {
        if (direction === "outbound") {
          state.selectedOutbound = flight;
          state.collapsedLists.outbound = true;
          if (state.search.returnDate) {
            state.collapsedLists.return = false;
          }
          if (state.search.returnDate && !state.selectedReturn) {
            const returnSection = document.getElementById("returnSection");
            returnSection?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          state.selectedReturn = flight;
          state.collapsedLists.return = true;
        }
        rerender();
      });

      root.appendChild(item);
    });
  }

  function getGroundPrice() {
    return intermodalCatalog[state.groundService]?.price || 0;
  }

  function buildCartOrderPayload() {
    const roundTrip = Boolean(state.search.returnDate);
    const passengerCount = Math.max(Number(state.search.passengers || 1), 1);
    const travelLegs = roundTrip ? 2 : 1;
    const base = ((state.selectedOutbound?.base || 0) + (state.selectedReturn?.base || 0)) * passengerCount;
    const tua = ((state.selectedOutbound?.tua || 0) + (state.selectedReturn?.tua || 0)) * passengerCount;
    const groundUnitPrice = getGroundPrice();
    const ground = groundUnitPrice * passengerCount * travelLegs;
    const total = base + tua + ground;
    const selectedAddons = ground > 0
      ? [{
        id: `intermodal-${state.groundService}`,
        type: "intermodal",
        service: state.groundService,
        option: state.groundOption,
        name: intermodalCatalog[state.groundService]?.label || "Intermodal",
        unitPrice: groundUnitPrice,
        quantity: passengerCount * travelLegs,
        price: ground,
      }]
      : [];

    return {
      createdAt: new Date().toISOString(),
      search: { ...state.search },
      roundTrip,
      passengers: passengerCount,
      selectedOutbound: state.selectedOutbound ? { ...state.selectedOutbound } : null,
      selectedReturn: state.selectedReturn ? { ...state.selectedReturn } : null,
      intermodal: {
        service: state.groundService,
        option: state.groundOption,
        label: intermodalCatalog[state.groundService]?.label || "Sin intermodal",
        unitPrice: groundUnitPrice,
        totalPrice: ground,
      },
      selectedAddons,
      totals: {
        base,
        tua,
        ground,
        grand: total,
      },
    };
  }

  function hasValidSelectionForCart() {
    if (!state.selectedOutbound) return false;
    if (state.search.returnDate && !state.selectedReturn) return false;
    return true;
  }

  function syncAddOrderAction() {
    const addOrderBtn = document.getElementById("addOrderBtn");
    const addOrderHint = document.getElementById("addOrderHint");
    if (!addOrderBtn) return;

    const isReady = hasValidSelectionForCart();
    addOrderBtn.disabled = !isReady;

    if (addOrderHint) {
      addOrderHint.textContent = isReady
        ? "Se guardará temporalmente y pasarás al paso 2: carrito."
        : "Selecciona tus vuelos para agregar el pedido al carrito.";
    }
  }

  function syncIntermodalControls() {
    const transferChip = document.getElementById("transferChip");
    const busChip = document.getElementById("busChip");
    const transferSelectBtn = document.getElementById("transferSelectBtn");
    const busSelectBtn = document.getElementById("busSelectBtn");

    const transferPrice = intermodalCatalog.transfer.price;
    const busPrice = intermodalCatalog.bus.price;

    if (transferChip) transferChip.textContent = `+$${transferPrice}`;
    if (busChip) busChip.textContent = `+$${busPrice}`;

    if (transferSelectBtn) {
      transferSelectBtn.textContent = `Usar Viva Transfer (+$${transferPrice})`;
      transferSelectBtn.classList.toggle("active", state.groundService === "transfer");
    }

    if (busSelectBtn) {
      busSelectBtn.textContent = `Usar Viva Bus (+$${busPrice})`;
      busSelectBtn.classList.toggle("active", state.groundService === "bus");
    }
  }

  function applyEmbeddedIntermodalSelection(payload) {
    if (!payload || typeof payload !== "object") return;

    const service = payload.service;
    if (!["transfer", "bus"].includes(service)) return;

    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) return;

    const cleanPrice = Math.round(clamp(price, 0, 5000));
    const cleanOption = typeof payload.option === "string" && payload.option.trim()
      ? payload.option.trim()
      : intermodalCatalog[service].option || "default";
    const customLabel = typeof payload.label === "string" ? payload.label.trim() : "";

    intermodalCatalog[service].price = cleanPrice;
    intermodalCatalog[service].option = cleanOption;
    intermodalCatalog[service].label = customLabel
      ? `${intermodalCatalog[service].baseLabel} · ${customLabel}`
      : intermodalCatalog[service].baseLabel;

    state.groundService = service;
    state.groundOption = cleanOption;

    syncIntermodalControls();
    updatePreview();
  }

  function wireEmbeddedIntermodalMessages() {
    window.addEventListener("message", (event) => {
      const data = event?.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "viva-intermodal-selection") return;
      applyEmbeddedIntermodalSelection(data);
    });
  }

  function updatePreview() {
    const roundTrip = Boolean(state.search.returnDate);
    const passengerCount = Math.max(Number(state.search.passengers || 1), 1);
    const travelLegs = roundTrip ? 2 : 1;
    const base = ((state.selectedOutbound?.base || 0) + (state.selectedReturn?.base || 0)) * passengerCount;
    const tua = ((state.selectedOutbound?.tua || 0) + (state.selectedReturn?.tua || 0)) * passengerCount;
    const ground = getGroundPrice() * passengerCount * travelLegs;
    const total = base + tua + ground;

    const routeSummary = document.getElementById("routeSummary");
    const selectedOutbound = document.getElementById("selectedOutbound");
    const selectedReturn = document.getElementById("selectedReturn");
    const baseTotal = document.getElementById("baseTotal");
    const tuaTotal = document.getElementById("tuaTotal");
    const groundTotal = document.getElementById("groundTotal");
    const grandTotal = document.getElementById("grandTotal");
    const intermodalSelection = document.getElementById("intermodalSelection");
    const originAccessBadge = document.getElementById("originAccessBadge");
    const destinationAccessBadge = document.getElementById("destinationAccessBadge");
    const compareBox = document.getElementById("intermodalCompare");
    const compareNormalTotal = document.getElementById("compareNormalTotal");
    const compareIntermodalTotal = document.getElementById("compareIntermodalTotal");
    const compareDelta = document.getElementById("compareDelta");
    const compareNormalTimeline = document.getElementById("compareNormalTimeline");
    const compareIntermodalTimeline = document.getElementById("compareIntermodalTimeline");

    if (routeSummary) {
      routeSummary.textContent = `Ruta: ${state.search.origin || "-"} → ${state.search.destination || "-"}`;
    }

    const originMeta = getDestinationByName(state.search.origin) || {};
    const destinationMeta = getDestinationByName(state.search.destination) || {};

    if (originAccessBadge) {
      const access = formatAccessBadge(originMeta.accessMode || "air_only", "Origen", originMeta.busProfitable);
      originAccessBadge.innerHTML = access.html;
      originAccessBadge.className = `access-badge ${access.className}`;
    }

    if (destinationAccessBadge) {
      const access = formatAccessBadge(destinationMeta.accessMode || "air_only", "Destino", destinationMeta.busProfitable);
      destinationAccessBadge.innerHTML = access.html;
      destinationAccessBadge.className = `access-badge ${access.className}`;
    }

    if (selectedOutbound) {
      selectedOutbound.textContent = state.selectedOutbound
            ? `${state.selectedOutbound.airline} ${state.selectedOutbound.departTime} ($${state.selectedOutbound.total * passengerCount})`
        : "Sin seleccionar";
    }

    if (selectedReturn) {
      selectedReturn.textContent = roundTrip
        ? state.selectedReturn
          ? `${state.selectedReturn.airline} ${state.selectedReturn.departTime} ($${state.selectedReturn.total * passengerCount})`
          : "Sin seleccionar"
        : "No aplica";
    }

    if (baseTotal) baseTotal.textContent = `$${base}`;
    if (tuaTotal) tuaTotal.textContent = `$${tua}`;
    if (groundTotal) groundTotal.textContent = `$${ground}`;
    if (grandTotal) grandTotal.textContent = `$${total}`;
    if (intermodalSelection) {
      intermodalSelection.textContent = intermodalCatalog[state.groundService]?.label || "Sin intermodal";
    }

    if (compareBox && compareNormalTotal && compareIntermodalTotal && compareDelta) {
      const hasSelection = Boolean(state.selectedOutbound || state.selectedReturn);
      compareBox.hidden = !hasSelection;

      if (hasSelection) {
        const referenceFlight = state.selectedOutbound || state.selectedReturn;
        const normal = base + tua;
        const intermodal = normal + ground;
        const delta = intermodal - normal;

        compareNormalTotal.textContent = `$${normal}`;
        compareIntermodalTotal.textContent = `$${intermodal}`;
        if (compareNormalTimeline) {
          compareNormalTimeline.innerHTML = renderTrajectoryLine(buildNormalRouteSegments(referenceFlight));
        }

        if (compareIntermodalTimeline) {
          const intermodalSegments = buildIntermodalRouteSegments(referenceFlight, originMeta, destinationMeta);
          compareIntermodalTimeline.innerHTML = renderTrajectoryLine(intermodalSegments);
        }

        compareDelta.textContent = delta === 0
          ? "Sin diferencia por intermodal (no seleccionado)."
          : `Diferencia intermodal: +$${delta}`;
      }
    }

    syncAddOrderAction();
  }

  function renderFareStrip() {
    const strip = document.getElementById("fareStripDays");
    if (!strip) return;

    strip.innerHTML = "";

    const baseDate = state.search.departDate || toIsoDate(new Date());

    for (let offset = -3; offset <= 3; offset += 1) {
      const day = addDays(baseDate, offset);
      const flights = buildFlights("outbound", { departDate: day, returnDate: state.search.returnDate });
      const lowest = Math.min(...flights.map((flight) => flight.total));

      const button = document.createElement("button");
      button.type = "button";
      button.className = `fare-day ${day === state.search.departDate ? "is-selected" : ""}`;
      button.innerHTML = `
        <span class="fare-day-date">${formatShortDate(day)}</span>
        <span class="fare-day-price">Desde $${lowest}</span>
      `;

      button.addEventListener("click", () => {
        const previousDepart = state.search.departDate;
        const previousReturn = state.search.returnDate;
        const tripLength = diffDays(previousDepart, previousReturn);

        state.search.departDate = day;
        const departInput = document.getElementById("resultsDepartDate");
        if (departInput) departInput.value = day;

        if (previousReturn) {
          const nextReturn = addDays(day, Math.max(tripLength, 1));
          state.search.returnDate = nextReturn;
          const returnInput = document.getElementById("resultsReturnDate");
          if (returnInput) returnInput.value = nextReturn;
        }

        state.selectedOutbound = null;
        state.selectedReturn = null;
        rerender();
      });

      strip.appendChild(button);
    }
  }

  function rerender() {
    const outboundSection = document.getElementById("outboundSection");
    const returnSection = document.getElementById("returnSection");

    const outboundFlights = buildFlights("outbound", { departDate: state.search.departDate, returnDate: state.search.returnDate });
    renderFlightList("outboundList", outboundFlights, "outbound");

    if (state.search.returnDate) {
      if (returnSection) returnSection.hidden = false;
      const returnFlights = buildFlights("return", { departDate: state.search.departDate, returnDate: state.search.returnDate });
      renderFlightList("returnList", returnFlights, "return");

      if (outboundSection) {
        const shouldCompactOutbound = Boolean(state.selectedOutbound) && !state.selectedReturn;
        outboundSection.classList.toggle("is-compact", shouldCompactOutbound);
      }

      if (returnSection) {
        const shouldHighlightReturn = Boolean(state.selectedOutbound) && !state.selectedReturn;
        returnSection.classList.toggle("is-focused", shouldHighlightReturn);
      }
    } else {
      if (returnSection) returnSection.hidden = true;
      state.selectedReturn = null;
      state.collapsedLists.return = false;
      if (outboundSection) outboundSection.classList.remove("is-compact");
    }

    syncListCollapseUI();
    updatePreview();
    renderFareStrip();
  }

  function syncListCollapseUI() {
    const outboundSection = document.getElementById("outboundSection");
    const returnSection = document.getElementById("returnSection");
    const toggleOutbound = document.getElementById("toggleOutbound");
    const toggleReturn = document.getElementById("toggleReturn");

    if (outboundSection) {
      outboundSection.classList.toggle("is-collapsed", state.collapsedLists.outbound);
    }
    if (toggleOutbound) {
      toggleOutbound.textContent = state.collapsedLists.outbound ? "Expandir" : "Minimizar";
      toggleOutbound.setAttribute("aria-expanded", String(!state.collapsedLists.outbound));
    }

    if (returnSection) {
      returnSection.classList.toggle("is-collapsed", state.collapsedLists.return);
    }
    if (toggleReturn) {
      toggleReturn.textContent = state.collapsedLists.return ? "Expandir" : "Minimizar";
      toggleReturn.setAttribute("aria-expanded", String(!state.collapsedLists.return));
    }
  }

  function wireListToggles() {
    const toggleOutbound = document.getElementById("toggleOutbound");
    const toggleReturn = document.getElementById("toggleReturn");

    toggleOutbound?.addEventListener("click", () => {
      state.collapsedLists.outbound = !state.collapsedLists.outbound;
      syncListCollapseUI();
    });

    toggleReturn?.addEventListener("click", () => {
      state.collapsedLists.return = !state.collapsedLists.return;
      syncListCollapseUI();
    });
  }

  async function loadDestinations() {
    try {
      const apiData = await window.fetchDestinations();
      state.allDestinations = Array.isArray(apiData) && apiData.length ? apiData : FALLBACK_DESTINATIONS;
    } catch (error) {
      state.allDestinations = FALLBACK_DESTINATIONS;
    }
  }

  function applyDestinationFilter(type, originDropdown, destinationDropdown) {
    const filtered = type ? state.allDestinations.filter((item) => item.type === type) : state.allDestinations;
    const mapped = filtered.map(toDropdownItem);
    originDropdown.setItems(mapped);
    destinationDropdown.setItems(mapped);
  }

  function wireSearchForm(originDropdown, destinationDropdown) {
    const form = document.getElementById("resultsSearchForm");
    const originHidden = document.getElementById("resultsOriginValue");
    const destinationHidden = document.getElementById("resultsDestinationValue");
    const status = document.getElementById("searchStatus");
    const departDate = document.getElementById("resultsDepartDate");
    const returnDate = document.getElementById("resultsReturnDate");
    const passengers = document.getElementById("resultsPassengers");
    const typeFilter = document.getElementById("resultsTypeFilter");

    function syncSearchStatus() {
      const origin = originDropdown.getSelected();
      const destination = destinationDropdown.getSelected();

      if (originHidden) originHidden.value = origin ? origin.meta.name : "";
      if (destinationHidden) destinationHidden.value = destination ? destination.meta.name : "";

      if (!origin || !destination) {
        status.textContent = "Selecciona origen y destino para generar vuelos.";
      } else {
        status.textContent = `Buscando ruta ${origin.meta.name} → ${destination.meta.name}`;
      }
    }

    originDropdown.setOnSelect(syncSearchStatus);
    destinationDropdown.setOnSelect(syncSearchStatus);

    typeFilter?.addEventListener("change", (event) => {
      applyDestinationFilter(event.target.value, originDropdown, destinationDropdown);
      originDropdown.clear();
      destinationDropdown.clear();
      syncSearchStatus();
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const selectedOrigin = originDropdown.getSelected();
      const selectedDestination = destinationDropdown.getSelected();

      const origin = selectedOrigin?.meta?.name || originHidden?.value || "";
      const destination = selectedDestination?.meta?.name || destinationHidden?.value || "";

      if (!origin || !destination) {
        status.textContent = "Selecciona origen y destino para continuar.";
        return;
      }

      const payload = {
        origin,
        destination,
        departDate: departDate?.value || "",
        returnDate: returnDate?.value || "",
        passengers: passengers?.value || "1",
      };

      state.search = { ...payload };
      state.selectedOutbound = null;
      state.selectedReturn = null;
      state.collapsedLists.outbound = false;
      state.collapsedLists.return = false;
      rerender();

      sessionStorage.setItem("flightSearch", JSON.stringify(payload));
      const query = new URLSearchParams(payload).toString();
      window.location.href = `../results/?${query}`;
    });
  }

  function wireGroundOptions() {
    const intermodalButtons = document.querySelectorAll("[data-ground]");

    intermodalButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.ground || "none";
        state.groundService = next;
        state.groundOption = intermodalCatalog[next]?.option || next;
        syncIntermodalControls();
        updatePreview();
      });
    });

    const service = document.getElementById("groundService");
    if (service) {
      service.addEventListener("change", (event) => {
        state.groundService = event.target.value;
        updatePreview();
      });
    }

    const option = document.getElementById("groundOption");
    if (option) {
      option.addEventListener("change", (event) => {
        state.groundOption = event.target.value;
        updatePreview();
      });
    }

    const clearBtn = document.querySelector(".intermodal-clear-btn");
    clearBtn?.addEventListener("click", () => {
      state.groundService = "none";
      state.groundOption = "none";
      syncIntermodalControls();
      updatePreview();
    });

  }

  function wireAddOrderButton() {
    const addOrderBtn = document.getElementById("addOrderBtn");
    if (!addOrderBtn) return;

    addOrderBtn.addEventListener("click", () => {
      if (!hasValidSelectionForCart()) {
        syncAddOrderAction();
        return;
      }

      const payload = buildCartOrderPayload();

      try {
        sessionStorage.setItem("flightCartOrder", JSON.stringify(payload));
      } catch (error) {
        return;
      }

      window.location.href = "../cart/";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const initial = parseSearchData() || {
      origin: "Ciudad de México (AICM)",
      destination: "Cancún",
      departDate: "",
      returnDate: "",
      passengers: "1",
    };

    state.search = initial;
    if (!state.search.departDate) {
      state.search.departDate = toIsoDate(new Date());
    }

    const departDateInput = document.getElementById("resultsDepartDate");
    const returnDateInput = document.getElementById("resultsReturnDate");
    const passengersInput = document.getElementById("resultsPassengers");

    if (departDateInput) departDateInput.value = state.search.departDate || "";
    if (returnDateInput) returnDateInput.value = state.search.returnDate || "";
    if (passengersInput) passengersInput.value = state.search.passengers || "1";

    await loadDestinations();

    const originRoot = document.getElementById("resultsOrigin");
    const destinationRoot = document.getElementById("resultsDestination");

    if (!originRoot || !destinationRoot || !window.createDestinationDropdown) {
      wireListToggles();
      wireGroundOptions();
      wireEmbeddedIntermodalMessages();
      wireAddOrderButton();
      syncIntermodalControls();
      rerender();
      return;
    }

    const originDropdown = window.createDestinationDropdown({
      root: originRoot,
      placeholder: "Escribe origen...",
      onSelect: () => {},
    });

    const destinationDropdown = window.createDestinationDropdown({
      root: destinationRoot,
      placeholder: "Escribe destino...",
      onSelect: () => {},
    });

    applyDestinationFilter("", originDropdown, destinationDropdown);

    wireSearchForm(originDropdown, destinationDropdown);
    originDropdown.setSelectedBy((item) => item.meta.name === state.search.origin);
    destinationDropdown.setSelectedBy((item) => item.meta.name === state.search.destination);
    wireListToggles();
    wireGroundOptions();
    wireEmbeddedIntermodalMessages();
    wireAddOrderButton();
    syncIntermodalControls();
    rerender();
  });
})();
