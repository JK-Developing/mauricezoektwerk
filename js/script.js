// Externe vacatureplatforms en hun URL-opbouw.
const jobSources = [
  {
    name: "Indeed",
    base: "https://nl.indeed.com/jobs",
    description: "Groot aanbod vacatures in Nederland, van startersfuncties tot senior rollen.",
    buildUrl: ({ zoektermInvoer, locatie }) => {
      const params = new URLSearchParams();
      if (zoektermInvoer) params.set("q", zoektermInvoer);
      if (locatie) params.set("l", locatie);
      return `https://nl.indeed.com/jobs?${params.toString()}`;
    }
  },
  {
    name: "Randstad",
    base: "https://www.randstad.nl/vacatures",
    description: "Vacatures via een bekende recruiter met focus op diverse sectoren.",
    buildUrl: ({ zoektermInvoer, locatie }) => {
      const params = new URLSearchParams();
      if (zoektermInvoer) params.set("zoekterm", zoektermInvoer);
      if (locatie) params.set("locatie", locatie);
      const query = params.toString();
      return query ? `https://www.randstad.nl/vacatures?${query}` : "https://www.randstad.nl/vacatures";
    }
  },
  {
    name: "Werk.nl",
    base: "https://www.werk.nl/nl/vacatures",
    description: "Vacatures via het landelijke werkplatform met brede regionale dekking.",
    buildUrl: () => {
      return "https://www.werk.nl/nl/vacatures/";
    }
  },
  {
    name: "Jobbird",
    base: "https://www.jobbird.com/nl/vacature",
    description: "Vacatures met directe filters op functie en locatie, handig voor retail rollen.",
    buildUrl: ({ zoektermInvoer, locatie }) => {
      const params = new URLSearchParams();
      if (zoektermInvoer) params.set("s", zoektermInvoer);
      if (locatie) params.set("p", locatie);
      params.set("rad", "30");
      params.set("jobAlertEmail", "");
      return `https://www.jobbird.com/nl/vacature?${params.toString()}`;
    }
  },
  {
    name: "Nationale Vacaturebank",
    base: "https://www.nationalevacaturebank.nl/vacature/zoeken",
    description: "Breed vacatureplatform met veel functies binnen uiteenlopende vakgebieden.",
    buildUrl: ({ zoektermInvoer, locatie }) => {
      const params = new URLSearchParams();
      if (zoektermInvoer) params.set("query", zoektermInvoer);
      if (locatie) params.set("location", locatie);
      params.set("sort", "relevance");
      const query = params.toString();
      return `https://www.nationalevacaturebank.nl/vacature/zoeken?${query}`;
    }
  }
];

const form = document.getElementById("searchForm");
const zoektermInput = document.getElementById("zoekterm");
const locatieInput = document.getElementById("locatie");
const dienstverbandInput = document.getElementById("dienstverband");
const profielKeywordsInput = document.getElementById("profielKeywords");
const shareProfileBtn = document.getElementById("shareProfileBtn");
const shareFeedback = document.getElementById("shareFeedback");
const shareModal = document.getElementById("shareModal");
const shareTextPreview = document.getElementById("shareTextPreview");
const copyShareTextBtn = document.getElementById("copyShareTextBtn");
const openLinkedInBtn = document.getElementById("openLinkedInBtn");
const shareModalFeedback = document.getElementById("shareModalFeedback");
const loadingIndicator = document.getElementById("loadingIndicator");
const emptyState = document.getElementById("emptyState");
const resultsGrid = document.getElementById("resultsGrid");
const yearElement = document.getElementById("year");
const quickChips = document.querySelectorAll(".quick-chip");

const DEFAULT_REGION_VALUE = "Haarlem Amsterdam Leiden Den Haag";
const REGION_PREF_KEY = "mzwo_default_region_set";

const linkedInShareText =
  "✨ Ik ben klaar voor een nieuwe stap binnen premium & luxury retail. " +
  "Na verschillende ervaringen binnen high-end retail ben ik op zoek naar een nieuwe uitdaging als " +
  "Assistent Manager, Showroom Assistant, Fashion Advisor of (Brand/Product) Specialist in de regio " +
  "Haarlem, Amsterdam, Leiden of Den Haag. Mijn kracht ligt in het verbinden van mensen, service en commercie. " +
  "In mijn rol bij o.a. De Bijenkorf heb ik collega's gecoacht en servicebeleving versterkt. " +
  "Ken jij een passende rol of vacature? Ik kom graag in contact. 🙏";

yearElement.textContent = new Date().getFullYear();

function sanitizeInput(value) {
  return value.trim();
}

function buildSearchModel() {
  const zoekterm = sanitizeInput(zoektermInput.value);
  const locatie = sanitizeInput(locatieInput.value);
  const dienstverband = sanitizeInput(dienstverbandInput.value);
  const zoektermInvoer = zoekterm;

  const standaardRegio = DEFAULT_REGION_VALUE;
  const regioContext = locatie ? "" : standaardRegio;

  // Het dienstverband voegen we toe aan de zoekterm, zodat platforms zonder specifieke filter-parameter
  // toch een relevante zoekopdracht krijgen.
  const samengesteldeZoekterm = [zoekterm, dienstverband, regioContext]
    .filter(Boolean)
    .join(" ");

  return {
    zoekterm: samengesteldeZoekterm,
    zoektermInvoer,
    locatie,
    dienstverband
  };
}

function ensureDefaultRegionPreference() {
  const hasSetPreference = window.localStorage.getItem(REGION_PREF_KEY);

  if (!hasSetPreference) {
    locatieInput.value = DEFAULT_REGION_VALUE;
    window.localStorage.setItem(REGION_PREF_KEY, "true");
  }
}

function setShareFeedback(message) {
  shareFeedback.textContent = message;
}

function setShareModalFeedback(message) {
  shareModalFeedback.textContent = message;
}

function openLinkedIn() {
  window.open("https://www.linkedin.com/feed/", "_blank", "noopener,noreferrer");
}

async function copyShareText() {
  try {
    await navigator.clipboard.writeText(linkedInShareText);
    setShareModalFeedback("LinkedIn-tekst gekopieerd.");
    setShareFeedback("LinkedIn-tekst staat klaar om te delen.");
  } catch {
    setShareModalFeedback("Kopieren lukte niet automatisch. Selecteer en kopieer de tekst handmatig.");
    setShareFeedback("Gebruik de tekst in de preview om handmatig te delen.");
  }
}

function openSharePreviewModal() {
  shareTextPreview.value = linkedInShareText;
  setShareModalFeedback("");

  // Fallback voor browsers zonder dialog ondersteuning.
  if (typeof shareModal.showModal !== "function") {
    copyShareText();
    openLinkedIn();
    return;
  }

  shareModal.showModal();
  shareTextPreview.focus();
}

async function handleProfileShare() {
  openSharePreviewModal();
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

function setZoektermFromQuickChip(role) {
  zoektermInput.value = role;
  quickChips.forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.role === role);
  });
  zoektermInput.focus();
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

quickChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setZoektermFromQuickChip(chip.dataset.role || "");
  });
});

shareProfileBtn.addEventListener("click", handleProfileShare);
copyShareTextBtn.addEventListener("click", copyShareText);
openLinkedInBtn.addEventListener("click", () => {
  openLinkedIn();
  setShareModalFeedback("LinkedIn is geopend in een nieuw tabblad.");
});
ensureDefaultRegionPreference();
