    const nominatimURL = "https://nominatim.openstreetmap.org/reverse";

    // Initialize the map
    const map = L.map('map').setView([10.3157, 123.8854], 10); // Cebu, Philippines

    // Add OpneStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            let currentMarker = null; // To store only one marker at a time

            // Function to add a single marker (removes previous marker)
            async function addMarker(lat, lon, text) {
                if (currentMarker) {
                    map.removeLayer(currentMarker); // Remove previous marker
                }

                currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(text).openPopup();
                map.setView([lat, lon]);

                const locationName = await getLocationName(lat, lon);
                userInput.value = `Location: ${locationName}`;
            }

            // Allow users to add markers by clicking on the map
            map.on('click', function(event) {
                const { lat, lng } = event.latlng;
                const markerText = `Marker at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                addMarker(lat, lng, markerText);
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
                                    addMarker(lat, lon, location);
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