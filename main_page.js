const nominatimURL = "https://nominatim.openstreetmap.org/reverse";

// Initialize the map, set it in Cebu
const map = L.map('map').setView([10.3157, 123.8854], 10); 

// Add OpneStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
//one marker at a time
let currentMarker = null; 

async function addMarker(lat, lon) {
    if (currentMarker) {
        map.removeLayer(currentMarker); // Remove previous marker
    }

    const locationName = await getLocationName(lat, lon);
    currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(locationName).openPopup();
    map.setView([lat, lon]);

    userInput.value = `Location: ${locationName}`;
}

// click  map
map.on('click', function(event) {
    const { lat, lng } = event.latlng;
    addMarker(lat, lng);
}); 

// Get location name using revese geocode
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
    if (!userMessage) {
        alert("Please enter a message before sending.");
        return;
    }

    userInput.value = ''; // Clear input field
    console.log("User Input:", userMessage);

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userMessage }),
        });

        const data = await response.json();
        const botMessage = data.result;

        // Adds messages to the chat history
        chatHistory.innerHTML += `<div class="user-message">${userMessage}</div>`;
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
