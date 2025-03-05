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
    document.getElementById('map-search').value = locationName;
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
        e.preventDefault(); // Prevent form submission
        const location = e.target.value;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    addMarker(lat, lon, location); // Pass the location name
                    sendLocationToChatbot(location); // Send location to chatbot
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
const loader = document.getElementById('loader');

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: userMessage,
                location: selectedLocation,
                lat: selectedLat,
                lon: selectedLon,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch response');
        }

        const data = await response.json();
        if (!data.result) {
            throw new Error('Empty AI response');
        }

        chatHistory.innerHTML += `<div class="user-message">${userMessage}</div>`;
        chatHistory.innerHTML += `<div class="bot-message">${data.result}</div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        chatHistory.innerHTML += `<div class="bot-message error">Error: ${error.message}</div>`;
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

// Function to send location to chatbot
function sendLocationToChatbot(location) {
    appendMessage("user", `Location: ${location}`);
    userInput.value = `Location: ${location}`; //sets the user input to the location.
    // Send the location to the chatbot for analysis
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    sendMessage().finally(()=>{
        loader.style.display = 'none';
    });
}

function appendMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(sender + "-message");
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to bottom
}