const nominatimURL = "https://nominatim.openstreetmap.org/reverse";

// Initialize the map
const map = L.map('map').setView([10.3157, 123.8854], 10); // Cebu, Philippines

// Add OpneStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarker = null; // To store only one marker at a time
let selectedLat = null;
let selectedLon = null;
let selectedLocation = "";

// Function to add a single marker (removes previous marker)
async function addMarker(lat, lon, locationName = null) {
    if (currentMarker) {
        map.removeLayer(currentMarker); // Remove previous marker
    }

    if (!locationName) {
        locationName = await getLocationName(lat, lon);
    }

    currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(locationName).openPopup();
    map.setView([lat, lon]);

    selectedLat = lat;
    selectedLon = lon;
    selectedLocation = locationName;

    // Update the search input
    mapSearch.value = locationName;
}

// Allow users to add markers by clicking on the map
map.on('click', function(event) {
    const { lat, lng } = event.latlng;
    addMarker(lat, lng);
}); 

// Function to get location name from coordinates (Reverse Geocoding)
async function getLocationName(lat, lon) {
    const url = `${nominatimURL}?format=json&lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.display_name || "Unknown Location";
    } catch (error) {
        console.error("Error fetching location name:", error);
    }
}

// For the map search
const mapSearch = document.getElementById('map-search');
mapSearch.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const location = e.target.value;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    addMarker(lat, lon);
                }
            })
            .catch(error => console.error('Error fetching location:', error));

        mapSearch.value = "";
    }
});

// Chat functionality
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const form = document.getElementById('chat-form');

async function sendMessage() {
    const userMessage = userInput.value.trim();

    const fullMessage = selectedLocation ? `Location: ${selectedLocation}\n${userMessage}`.trim() : userMessage;
    
    if (!selectedLocation && !userMessage) {
        alert("Please enter a message or select a location before sending.");
        return;
    }

    userInput.value = ''; // Clear input field
    console.log("User Input:", fullMessage);

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: fullMessage }),
        });

        const data = await response.json();
        const botMessage = data.result;

        // For the scale to be visualized
        const visualScaleElements = document.getElementsByClassName('visual-scale');
        const scaleMatch = botMessage.match(/Solar Farm Suitability Score: (\d+)/);
        let scaleColor = '';
        if (scaleMatch) {
            const score = Number(scaleMatch[1]);
            if (visualScaleElements.length > 0) {
                const hue = (score / 10) * 120;
                scaleColor = `hsl(${hue}, 100%, 50%)`;
            }
        }

        // Adds messages to the chat history
        chatHistory.innerHTML += `<div class="user-message">${fullMessage}</div>`;
        chatHistory.innerHTML += `<div class="bot-message">${botMessage}</div>`;

        // Check if response contains a location & add marker
        const locationMatch = botMessage.match(/Location: (.*)/);
        if (locationMatch) {
            const location = locationMatch[1];
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const { lat, lon } = data[0];
                        addMarker(lat, lon);
                    }
                })
                .catch(error => console.error('Error fetching location:', error));
        }

        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;

    } catch (error) {
        console.error('Error:', error);
    }
}

form.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent form submission
    const loader = document.getElementById('loader');
    loader.style.display = 'block'; // Show the loader

    sendMessage().finally(() => {
        loader.style.display = 'none'; // Hide the loader after the message is sent
    });
});