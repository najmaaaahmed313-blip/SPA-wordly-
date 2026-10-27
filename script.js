const form = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const results = document.getElementById("results");
const favoritesList = document.getElementById("favorites-list");
const favoritesStorageKey = "wordly-favorites";

let favorites = loadFavorites();
let currentEntry = null;

function loadFavorites() {
	try {
		const savedFavorites = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
		return Array.isArray(savedFavorites)
			? savedFavorites.filter((favorite) => typeof favorite === "string")
			: [];
	} catch {
		return [];
	}
}

function saveFavorites() {
	localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
}

function renderFavorites() {
	favoritesList.replaceChildren();
	if (favorites.length === 0) {
		const emptyItem = document.createElement("li");
		emptyItem.className = "empty-favorites";
		emptyItem.textContent = "No saved words yet.";
		favoritesList.append(emptyItem);
		return;
	}

	favorites.forEach((favorite) => {
		const item = document.createElement("li");
		item.className = "favorite-item";

		const word = document.createElement("span");
		word.className = "favorite-word";
		word.textContent = favorite;

		const removeButton = document.createElement("button");
		removeButton.className = "remove-favorite";
		removeButton.type = "button";
		removeButton.dataset.removeFavorite = favorite;
		removeButton.textContent = "Remove";
		removeButton.setAttribute("aria-label", `Remove ${favorite} from favorites`);

		item.append(word, removeButton);
		favoritesList.append(item);
	});
}

function updateFavoriteButton() {
	const panel = results.querySelector(".result-panel");
	const button = results.querySelector(".favorite-toggle");
	if (!currentEntry || !panel || !button) return;

	const isFavorite = favorites.includes(currentEntry.word);
	panel.classList.toggle("is-favorite", isFavorite);
	button.textContent = isFavorite ? "Remove favorite" : "Save favorite";
	button.setAttribute("aria-pressed", String(isFavorite));
}

function toggleFavorite(word) {
	if (favorites.includes(word)) {
		favorites = favorites.filter((favorite) => favorite !== word);
	} else {
		favorites.push(word);
	}
	saveFavorites();
	renderFavorites();
	updateFavoriteButton();
}

function renderEntry(entry) {
	currentEntry = entry;
	results.replaceChildren();
	const isFavorite = favorites.includes(entry.word);

	const panel = document.createElement("article");
	panel.className = `result-panel${isFavorite ? " is-favorite" : ""}`;

	const header = document.createElement("div");
	header.className = "result-header";

	const wordDetails = document.createElement("div");
	const heading = document.createElement("h2");
	heading.textContent = entry.word;
	wordDetails.append(heading);

	const phonetic = document.createElement("p");
	phonetic.className = "phonetic";
	phonetic.textContent = entry.phonetic || "";
	wordDetails.append(phonetic);

	const favoriteButton = document.createElement("button");
	favoriteButton.className = "favorite-toggle";
	favoriteButton.type = "button";
	favoriteButton.addEventListener("click", () => toggleFavorite(entry.word));
	header.append(wordDetails, favoriteButton);
	panel.append(header);

	entry.meanings.forEach((meaning) => {
		const definition = document.createElement("p");
		definition.className = "meaning";
		definition.textContent = `${meaning.partOfSpeech} - ${meaning.definitions[0].definition}`;
		panel.append(definition);
	});

	results.append(panel);
	updateFavoriteButton();
}

favoritesList.addEventListener("click", (event) => {
	const removeButton = event.target.closest("[data-remove-favorite]");
	if (removeButton) toggleFavorite(removeButton.dataset.removeFavorite);
});

renderFavorites();

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const word = wordInput.value.trim();
	if (!word) {
		results.textContent = "Please enter a word.";
		return;
	}

	try {
		const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
		if (!response.ok) {
			results.textContent = "Word not found";
			return;
		}
		const data = await response.json();
		renderEntry(data[0]);
	} catch (error) {
		console.log(error);
		results.textContent = "Something went wrong, please try again.";
	}
});
