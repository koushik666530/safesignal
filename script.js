// Safety Alert Website Script

document.addEventListener('DOMContentLoaded', () => {
    // Functionality for the Emergency Alert Button
    const alertButtons = document.querySelectorAll('.button');

    alertButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action

            const featureName = button.closest('.feature').querySelector('h3').textContent;

            if (featureName === 'Emergency Alert Button') {
                sendEmergencyAlert();
            } else if (featureName === 'Live Location Sharing') {
                shareLiveLocation();
            } else if (featureName === 'Fake Call Feature') {
                simulateFakeCall();
            } else if (featureName === 'Nearby Safe Zones') {
                locateSafeZones();
            }
        });
    });

    // Function to simulate sending an emergency alert
    function sendEmergencyAlert() {
        playSiren();
        alert('Emergency Alert Sent! Your trusted contacts have been notified.');
    }

    // Function to share live location
    function shareLiveLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                alert(`Live Location Shared! Latitude: ${latitude}, Longitude: ${longitude}`);
            }, () => {
                alert('Unable to access your location. Please enable location services.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }

    // Function to simulate a fake call
    function simulateFakeCall() {
        alert('Simulating a fake call... (This feature can be enhanced to ring your phone).');
    }

    // Function to locate nearby safe zones
    function locateSafeZones() {
        alert('Locating nearby safe zones... (This feature can be integrated with Google Maps).');
    }

    // Function to play a siren sound
    function playSiren() {
        const sirenAudio = new Audio('sirenaudio.mp3'); // Ensure this file exists in your project
        sirenAudio.play();
    }

    // Add event listener for the siren button
    const sirenButton = document.getElementById('sirenButton');
    if (sirenButton) {
        sirenButton.addEventListener('click', () => {
            playSiren();
        });
    }

    // Function to play a fake call
    function playcall() {
        const callAudio = new Audio('call.mp3'); // Ensure this file exists in your project
        callAudio.play();
    }

    // Add event listener for the siren button
    const callButton = document.getElementById('callButton');
    if (callButton) {
        callButton.addEventListener('click', () => {
            playcall();
        });
    }
});