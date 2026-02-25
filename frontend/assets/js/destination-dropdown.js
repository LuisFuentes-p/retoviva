(function () {
  function normalizeText(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function createDestinationDropdown(options) {
    const root = options.root;
    const placeholder = options.placeholder || "Buscar destino...";
    const noResultsText = options.noResultsText || "Sin resultados";
    let onSelect = typeof options.onSelect === "function" ? options.onSelect : () => {};

    let items = Array.isArray(options.items) ? options.items : [];
    let filteredItems = [...items];
    let highlightedIndex = -1;
    let selectedItem = null;

    root.classList.add("dest-dd");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "dest-dd-input";
    input.placeholder = placeholder;
    input.autocomplete = "off";

    const list = document.createElement("ul");
    list.className = "dest-dd-list";
    list.hidden = true;

    root.innerHTML = "";
    root.appendChild(input);
    root.appendChild(list);

    function renderList() {
      list.innerHTML = "";

      if (!filteredItems.length) {
        const empty = document.createElement("li");
        empty.className = "dest-dd-empty";
        empty.textContent = noResultsText;
        list.appendChild(empty);
        return;
      }

      filteredItems.forEach((item, index) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dest-dd-item";
        if (index === highlightedIndex) {
          button.classList.add("is-highlighted");
        }
        button.textContent = item.label;
        button.addEventListener("click", () => selectItem(item));
        li.appendChild(button);
        list.appendChild(li);
      });
    }

    function openList() {
      list.hidden = false;
    }

    function closeList() {
      list.hidden = true;
      highlightedIndex = -1;
      renderList();
    }

    function filterList(query) {
      const normalizedQuery = normalizeText(query);
      filteredItems = items.filter((item) => normalizeText(item.searchText || item.label).includes(normalizedQuery));
      highlightedIndex = filteredItems.length ? 0 : -1;
      renderList();
      openList();
    }

    function selectItem(item) {
      selectedItem = item;
      input.value = item.label;
      closeList();
      onSelect(item);
    }

    function setItems(nextItems) {
      items = Array.isArray(nextItems) ? nextItems : [];
      filteredItems = [...items];
      highlightedIndex = filteredItems.length ? 0 : -1;
      renderList();
    }

    input.addEventListener("focus", () => {
      filteredItems = [...items];
      highlightedIndex = filteredItems.length ? 0 : -1;
      renderList();
      openList();
    });

    input.addEventListener("input", (event) => {
      filterList(event.target.value);
    });

    input.addEventListener("keydown", (event) => {
      if (list.hidden) {
        openList();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!filteredItems.length) return;
        highlightedIndex = Math.min(highlightedIndex + 1, filteredItems.length - 1);
        renderList();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!filteredItems.length) return;
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        renderList();
      } else if (event.key === "Enter") {
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          event.preventDefault();
          selectItem(filteredItems[highlightedIndex]);
        }
      } else if (event.key === "Escape") {
        closeList();
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) {
        closeList();
      }
    });

    setItems(items);

    return {
      setItems,
      setOnSelect(nextOnSelect) {
        onSelect = typeof nextOnSelect === "function" ? nextOnSelect : () => {};
      },
      setSelectedBy(predicate) {
        const item = items.find(predicate);
        if (!item) return false;
        selectedItem = item;
        input.value = item.label;
        onSelect(item);
        return true;
      },
      clear() {
        selectedItem = null;
        input.value = "";
        filteredItems = [...items];
        highlightedIndex = filteredItems.length ? 0 : -1;
        renderList();
      },
      getSelected() {
        return selectedItem;
      },
    };
  }

  async function fetchDestinations(params) {
    const query = new URLSearchParams(params || {}).toString();
    const response = await fetch(`/api/destinations${query ? `?${query}` : ""}`);
    if (!response.ok) {
      throw new Error("No fue posible cargar destinos");
    }
    return response.json();
  }

  window.createDestinationDropdown = createDestinationDropdown;
  window.fetchDestinations = fetchDestinations;
})();
