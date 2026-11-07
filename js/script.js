// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('button');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const galleryUrl = 'https://api.nasa.gov/planetary/apod';
let currentSpaceImages = [];

// DEMO_KEY is provided by NASA for learning and small tests.
const apiKey = 'gfmzLkQdCgLhMJhhHNL9ppjnMPnjQjbTBDNtQphz';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Fetch APOD items for a new date range when the button is clicked.
getImagesButton.addEventListener('click', getSpaceImages);
gallery.addEventListener('click', openSelectedImage);
closeModalButton.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeImageModal();
	}
});
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.hidden) {
		closeImageModal();
	}
});

// Show the default date range as space images when the page loads.
getSpaceImages();

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;
	const query = new URLSearchParams({
		api_key: apiKey,
		start_date: startDate,
		end_date: endDate
	});
	const apiUrl = `${galleryUrl}?${query}`;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	gallery.innerHTML = '<p>Loading space images...</p>';

	try {
		const response = await fetch(apiUrl, { signal: controller.signal });

		if (!response.ok) {
			throw new Error('NASA could not return the images.');
		}

		const spaceImages = await response.json();

		if (!Array.isArray(spaceImages)) {
			throw new Error('NASA returned an unexpected response.');
		}

		const apodItems = spaceImages.filter((spaceImage) =>
			['image', 'video'].includes(spaceImage.media_type) && spaceImage.url
		);

		currentSpaceImages = apodItems;
		displaySpaceImages(apodItems);
	} catch (error) {
		const message = error.name === 'AbortError'
			? 'NASA took too long to respond. Please try again.'
			: error.message;
		gallery.innerHTML = `<p>Sorry, something went wrong: ${message}</p>`;
	} finally {
		clearTimeout(timeoutId);
	}
}

function displaySpaceImages(spaceImages) {
	if (spaceImages.length === 0) {
		gallery.innerHTML = '<p>No space images were found for these dates.</p>';
		return;
	}

	gallery.innerHTML = spaceImages.map((spaceImage, index) => {
		const media = spaceImage.media_type === 'video'
			? `<a href="${spaceImage.url}" target="_blank" rel="noopener noreferrer">Watch this APOD video on NASA</a>`
			: `<img src="${spaceImage.url}" alt="${spaceImage.title}">`;

		return `
			<article class="gallery-item" data-image-index="${index}" tabindex="0">
				${media}
				<h2>${spaceImage.title}</h2>
				<p class="date">${spaceImage.date}</p>
			</article>
		`;
	}).join('');
}

function openSelectedImage(event) {
	if (event.target.closest('a')) {
		return;
	}

	const galleryItem = event.target.closest('.gallery-item');

	if (!galleryItem) {
		return;
	}

	const imageIndex = galleryItem.dataset.imageIndex;
	openImageModal(currentSpaceImages[imageIndex]);
}

function openImageModal(spaceImage) {
	modalMedia.innerHTML = spaceImage.media_type === 'video'
		? `<a href="${spaceImage.url}" target="_blank" rel="noopener noreferrer">Watch this APOD video on NASA</a>`
		: `<img src="${spaceImage.url}" alt="${spaceImage.title}">`;
	modalTitle.textContent = spaceImage.title;
	modalDate.textContent = spaceImage.date;
	modalExplanation.textContent = spaceImage.explanation;
	imageModal.hidden = false;
	closeModalButton.focus();
}

function closeImageModal() {
	imageModal.hidden = true;
	modalMedia.innerHTML = '';
}
