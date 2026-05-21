// Externe vacatureplatforms en hun URL-opbouw.
const jobSources = [
  {
    name: "Indeed",
    base: "https://nl.indeed.com/jobs",
    description: "Groot aanbod vacatures in Nederland, van startersfuncties tot senior rollen.",
    buildUrl: ({ zoekterm, locatie }) => {
      const params = new URLSearchParams();
      if (zoekterm) params.set("q", zoekterm);
      if (locatie) params.set("l", locatie);
      return `https://nl.indeed.com/jobs?${params.toString()}`;
    }
  },
  {
    name: "Randstad",
    base: "https://www.randstad.nl/vacatures",
    description: "Vacatures via een bekende recruiter met focus op diverse sectoren.",
    buildUrl: ({ zoekterm, locatie }) => {
      const params = new URLSearchParams();
      if (zoekterm) params.set("zoekterm", zoekterm);
      if (locatie) params.set("locatie", locatie);
      const query = params.toString();
      return query ? `https://www.randstad.nl/vacatures?${query}` : "https://www.randstad.nl/vacatures";
    }
  },
  {
    name: "Werk.nl",
    base: "https://www.werk.nl/nl/vacatures",
    description: "Vacatures via het landelijke werkplatform met brede regionale dekking.",
    buildUrl: ({ zoekterm, locatie }) => {
      const params = new URLSearchParams();
      if (zoekterm) params.set("zoekterm", zoekterm);
      if (locatie) params.set("plaats", locatie);
      const query = params.toString();
      return query ? `https://www.werk.nl/nl/vacatures?${query}` : "https://www.werk.nl/nl/vacatures";
    }
  },
  {
    name: "Nationale Vacaturebank",
    base: "https://www.nationalevacaturebank.nl/vacatures/",
    description: "Breed vacatureplatform met veel functies binnen uiteenlopende vakgebieden.",
    buildUrl: ({ zoekterm, locatie }) => {
      const params = new URLSearchParams();
      if (zoekterm) params.set("query", zoekterm);
      if (locatie) params.set("location", locatie);
      const query = params.toString();
      return query
        ? `https://www.nationalevacaturebank.nl/vacatures/zoek?${query}`
        : "https://www.nationalevacaturebank.nl/vacatures/";
    }
  }
];

const form = document.getElementById("searchForm");
const zoektermInput = document.getElementById("zoekterm");
const locatieInput = document.getElementById("locatie");
const dienstverbandInput = document.getElementById("dienstverband");
const loadingIndicator = document.getElementById("loadingIndicator");
const emptyState = document.getElementById("emptyState");
const resultsGrid = document.getElementById("resultsGrid");
const yearElement = document.getElementById("year");

yearElement.textContent = new Date().getFullYear();

function sanitizeInput(value) {
  return value.trim();
}

function buildSearchModel() {
  const zoekterm = sanitizeInput(zoektermInput.value);
  const locatie = sanitizeInput(locatieInput.value);
  const dienstverband = sanitizeInput(dienstverbandInput.value);

  // Het dienstverband voegen we toe aan de zoekterm, zodat platforms zonder specifieke filter-parameter
  // toch een relevante zoekopdracht krijgen.
  const samengesteldeZoekterm = [zoekterm, dienstverband].filter(Boolean).join(" ");

  return {
    zoekterm: samengesteldeZoekterm,
    locatie,
    dienstverband
  };
}

function shouldShowEmptyState({ zoekterm, locatie, dienstverband }) {
  return !zoekterm && !locatie && !dienstverband;
}

function createResultCard(source, searchModel, index) {
  const card = document.createElement("article");
  card.className = "result-card";
  card.style.animationDelay = `${index * 70}ms`;

  const title = document.createElement("h4");
  title.textContent = source.name;

  const description = document.createElement("p");
  description.textContent = source.description;

  const link = document.createElement("a");
  link.className = "btn btn-primary";
  link.href = source.buildUrl(searchModel);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Bekijk vacatures";
  link.setAttribute("aria-label", `Bekijk vacatures op ${source.name}`);

  card.append(title, description, link);
  return card;
}

function renderResults(searchModel) {
  resultsGrid.innerHTML = "";

  const cards = jobSources.map((source, index) => createResultCard(source, searchModel, index));
  cards.forEach((card) => resultsGrid.appendChild(card));
}

function setSearchingState(isLoading) {
  loadingIndicator.hidden = !isLoading;
  form.querySelector("button[type='submit']").disabled = isLoading;
}

function handleSearch(event) {
  event.preventDefault();

  const searchModel = buildSearchModel();
  const hasNoInput = shouldShowEmptyState(searchModel);

  if (hasNoInput) {
    resultsGrid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  setSearchingState(true);

  // Simuleert een korte laadtijd voor duidelijke gebruikersfeedback.
  window.setTimeout(() => {
    renderResults(searchModel);
    setSearchingState(false);
  }, 450);
}

form.addEventListener("submit", handleSearch);
