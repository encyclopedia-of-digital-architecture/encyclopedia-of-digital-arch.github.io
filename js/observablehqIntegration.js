// observablehqIntegration.js

function loadObservableHQChart() {
    // ObservableHQ embed kodunu ekranın sağ üst köşesindeki iframe'e yerleştir
    const chartFrame = document.getElementById('observablehq-chart-frame');
    chartFrame.src = "https://observablehq.com/embed/f3a4dccc0de59880?cells=chart";
}

// Example usage based on your condition
document.addEventListener("DOMContentLoaded", function() {
    const nodeName = "Conceptual Knowledge"; // Example condition

    if (nodeName === "Conceptual Knowledge") {
        loadObservableHQChart(); // Load the content inside iframe
    }
});
