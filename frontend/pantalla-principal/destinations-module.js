(function () {
  const FALLBACK_DESTINATIONS = [
    { name: "Acapulco", country: "México", type: "nacional", popular: true },
    { name: "Aguascalientes", country: "México", type: "nacional", popular: false },
    { name: "Ciudad Obregón", country: "México", type: "nacional", popular: false },
    { name: "Ciudad Juárez", country: "México", type: "nacional", popular: false },
    { name: "Culiacán", country: "México", type: "nacional", popular: true },
    { name: "Cancún", country: "México", type: "nacional", popular: true },
    { name: "Chihuahua", country: "México", type: "nacional", popular: false },
    { name: "Chetumal", country: "México", type: "nacional", popular: false },
    { name: "Ciudad de México (AICM)", country: "México", type: "nacional", popular: true },
    { name: "Ciudad de México (AIFA)", country: "México", type: "nacional", popular: true },
    { name: "Cozumel", country: "México", type: "nacional", popular: false },
    { name: "Durango", country: "México", type: "nacional", popular: false },
    { name: "Guadalajara", country: "México", type: "nacional", popular: true },
    { name: "Hermosillo", country: "México", type: "nacional", popular: false },
    { name: "Huatulco", country: "México", type: "nacional", popular: true },
    { name: "Ixtapa–Zihuatanejo", country: "México", type: "nacional", popular: false },
    { name: "La Paz", country: "México", type: "nacional", popular: false },
    { name: "León", country: "México", type: "nacional", popular: false },
    { name: "Los Mochis", country: "México", type: "nacional", popular: false },
    { name: "Los Cabos", country: "México", type: "nacional", popular: true },
    { name: "Matamoros", country: "México", type: "nacional", popular: false },
    { name: "Mérida", country: "México", type: "nacional", popular: true },
    { name: "Morelia", country: "México", type: "nacional", popular: false },
    { name: "Monterrey", country: "México", type: "nacional", popular: true },
    { name: "Mexicali", country: "México", type: "nacional", popular: false },
    { name: "Mazatlán", country: "México", type: "nacional", popular: true },
    { name: "Nuevo Laredo", country: "México", type: "nacional", popular: false },
    { name: "Oaxaca", country: "México", type: "nacional", popular: true },
    { name: "Puebla", country: "México", type: "nacional", popular: false },
    { name: "Puerto Vallarta", country: "México", type: "nacional", popular: true },
    { name: "Puerto Escondido", country: "México", type: "nacional", popular: true },
    { name: "Querétaro", country: "México", type: "nacional", popular: false },
    { name: "Reynosa", country: "México", type: "nacional", popular: false },
    { name: "San Luis Potosí", country: "México", type: "nacional", popular: false },
    { name: "Tampico", country: "México", type: "nacional", popular: false },
    { name: "Tapachula", country: "México", type: "nacional", popular: false },
    { name: "Tepic", country: "México", type: "nacional", popular: false },
    { name: "Tuxtla Gutiérrez", country: "México", type: "nacional", popular: false },
    { name: "Tijuana", country: "México", type: "nacional", popular: true },
    { name: "Toluca", country: "México", type: "nacional", popular: false },
    { name: "Torreón", country: "México", type: "nacional", popular: false },
    { name: "Tulum", country: "México", type: "nacional", popular: true },
    { name: "Veracruz", country: "México", type: "nacional", popular: false },
    { name: "Villahermosa", country: "México", type: "nacional", popular: false },
    { name: "Zacatecas", country: "México", type: "nacional", popular: false },
    { name: "Austin", country: "EUA", type: "internacional", popular: true },
    { name: "Camagüey", country: "Cuba", type: "internacional", popular: false },
    { name: "Chicago", country: "EUA", type: "internacional", popular: true },
    { name: "Cincinnati", country: "EUA", type: "internacional", popular: false },
    { name: "Dallas", country: "EUA", type: "internacional", popular: false },
    { name: "Denver", country: "EUA", type: "internacional", popular: true },
    { name: "La Habana", country: "Cuba", type: "internacional", popular: true },
    { name: "Houston", country: "EUA", type: "internacional", popular: true },
    { name: "Las Vegas", country: "EUA", type: "internacional", popular: true },
    { name: "Los Ángeles", country: "EUA", type: "internacional", popular: true },
    { name: "Miami", country: "EUA", type: "internacional", popular: true },
    { name: "Memphis", country: "EUA", type: "internacional", popular: false },
    { name: "Nashville", country: "EUA", type: "internacional", popular: false },
    { name: "Nueva York", country: "EUA", type: "internacional", popular: false },
    { name: "Oakland", country: "EUA", type: "internacional", popular: true },
    { name: "Orlando", country: "EUA", type: "internacional", popular: false },
    { name: "San Antonio", country: "EUA", type: "internacional", popular: true },
    { name: "San José", country: "Costa Rica", type: "internacional", popular: true },
    { name: "Bogotá", country: "Colombia", type: "internacional", popular: true },
  ];

  function toDropdownItem(destination) {
    const prefix = destination.type === "internacional" ? `${destination.name}, ${destination.country}` : destination.name;
    return {
      label: destination.popular ? `${prefix} · Popular` : prefix,
      searchText: `${destination.name} ${destination.country} ${destination.type}`,
      value: destination.name,
      meta: destination,
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const originRoot = document.getElementById("destinationOrigin");
    const targetRoot = document.getElementById("destinationTarget");
    const originHidden = document.getElementById("flightOriginValue");
    const destinationHidden = document.getElementById("flightDestinationValue");
    const status = document.getElementById("destinationStatus");
    const typeFilter = document.getElementById("destinationTypeFilter");

    if (!originRoot || !targetRoot || !window.createDestinationDropdown) {
      return;
    }

    let allDestinations = [];

    const originDropdown = window.createDestinationDropdown({
      root: originRoot,
      placeholder: "Escribe origen...",
      onSelect: updateStatus,
    });

    const targetDropdown = window.createDestinationDropdown({
      root: targetRoot,
      placeholder: "Escribe destino...",
      onSelect: updateStatus,
    });

    function updateStatus() {
      const origin = originDropdown.getSelected();
      const target = targetDropdown.getSelected();

      if (originHidden) {
        originHidden.value = origin ? origin.meta.name : "";
      }

      if (destinationHidden) {
        destinationHidden.value = target ? target.meta.name : "";
      }

      if (!origin || !target) {
        status.textContent = "Escribe para buscar y selecciona una opción de la lista.";
        return;
      }

      status.textContent = `Ruta seleccionada: ${origin.meta.name} → ${target.meta.name}`;
    }

    function applyFilter(type) {
      const filtered = type ? allDestinations.filter((item) => item.type === type) : allDestinations;
      const mapped = filtered.map(toDropdownItem);
      originDropdown.setItems(mapped);
      targetDropdown.setItems(mapped);
      originDropdown.clear();
      targetDropdown.clear();
      updateStatus();
    }

    try {
      const apiData = await window.fetchDestinations();
      allDestinations = Array.isArray(apiData) && apiData.length ? apiData : FALLBACK_DESTINATIONS;
      status.textContent = "Destinos cargados. Puedes filtrar por tipo o buscar por nombre.";
    } catch (error) {
      allDestinations = FALLBACK_DESTINATIONS;
      status.textContent = "Se cargó catálogo local de destinos (modo respaldo).";
    }

    applyFilter(typeFilter.value);

    typeFilter.addEventListener("change", (event) => {
      applyFilter(event.target.value);
    });
  });
})();
