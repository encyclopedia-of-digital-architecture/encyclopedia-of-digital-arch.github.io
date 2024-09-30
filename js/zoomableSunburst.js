function toggleZoomableSunburst() {
    var otherContent = document.getElementById("otherContent");
    var zoomableSunburstContainer = document.getElementById("zoomableSunburstContainer");
    var button = document.getElementById("toggleButton-1a");

    if (zoomableSunburstContainer.style.display === "block") {
        otherContent.style.display = "block";
        zoomableSunburstContainer.style.display = "none";
        button.classList.remove("active");
        document.getElementById('pdf-container').style.display = 'none'; // PDF'yi gizle
    } else {
        otherContent.style.display = "none";
        zoomableSunburstContainer.style.display = "block";
        loadZoomableSunburstChart(); // Grafiği yükle
        button.classList.add("active");
    }
}

const fill = "#ccc";
const fillOpacity = 0.6;

function loadZoomableSunburstChart() {
    var zoomableSunburstContainer = document.getElementById('zoomableSunburstContainer');
    zoomableSunburstContainer.innerHTML = ''; // Önceki içeriği temizle
    fetch("json/json5.json")
        .then(response => response.json())
        .then(data => {
            createChart(data);
        })
        .catch(error => console.error("Error loading JSON data:", error));
}

// Grafiği oluşturma fonksiyonu
function createChart(json5) {
    const width = window.innerWidth * 1;
    const height = width;
    const radius = width / 6;

    const color = d3.scaleOrdinal()
        .domain(json5.children.map((_, i) => i))
        .range(["#72a4ce", "#0031ae", "#4183bb"]);

    const hierarchy = d3.hierarchy(json5)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
        
    const root = d3.partition()
        .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
    root.each(d => d.current = d);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));


        const svg = d3.create("svg")
            .attr("id", "chart-svg")
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .style("font", "18px Segoe UI")
            .style("width", "100%")
            .style("height", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet");

    const path = svg.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
        .attr("d", d => arc(d.current))
        .on("click", clicked)
        .each(function (d) {
            if (d.depth === 1 && d.data.name.startsWith("Robotic Fabrication")) {
                d3.select(this).classed("highlighted-section", true);
            }
        });

    d3.selectAll('path')
        .on('click', function (event, d) {
            handleContentDisplay(d.data.name);
        });

    path.filter(d => d.children)
        .style("cursor", "pointer");

    const format = d3.format(",d");
    path.append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    const label = svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .style("font-size", "25px")
        .style("font-family", "Segoe UI")
        .text(d => d.data.name.length > 20 ? d.data.name.slice(0, 15) + "..." : d.data.name);

    const parent = svg.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

    let parentNameLabel = svg.append("text")
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .attr("fill-opacity", 1)
        .style("font-size", "24px")
        .style("font-family", "Segoe UI")
        .style("font-weight", "bold")
        .text(root.data.name);

    let currentDepth = 1; // Başlangıçta grafiğin en iç kısmında olduğumuzu varsayalım

    function clicked(event, p) {
        parent.datum(p.depth === 0 ? null : p.parent || root);
        parentNameLabel.text(p.depth === 0 ? root.data.name : p.data.name);

        root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = svg.transition().duration(750);

        path.transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function (d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
            .attrTween("d", d => () => arc(d.current));

        label.filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));

        handleContentDisplay(p.data.name);

        currentDepth = p.depth; // Güncel derinliği kaydet
    }

    document.addEventListener('DOMContentLoaded', function () {
        const backButton = document.querySelector('.back-button');
        backButton.addEventListener('click', function () {
            if (currentDepth > 1) {
                goBackOneStep();
            }
        });

        const innerMostCircleText = document.querySelector('.innermost-circle-text');
        innerMostCircleText.addEventListener('click', function () {
            if (currentDepth > 1) {
                goBackOneStep();
            }
        });
    });

    function goBackOneStep() {
        if (currentDepth > 1) {
            currentDepth--;
            clicked(null, parent.datum().parent);
        }
    }

    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    document.getElementById('zoomableSunburstContainer').appendChild(svg.node());
}



function handleContentDisplay(nodeName) {
    const validNodes = [
        "Collaborative Robotic Masonry and Early Stage Fatigue Prediction",
        "Conceptual Knowledge",
        "Procedural Knowledge",
        "Visual Knowledge",
        "Configurational Knowledge"
    ];

    const pdfContainer = document.getElementById('pdf-container');
    const iframeContainer = document.getElementById('iframe-container');
    const visualKnowledgeImg = document.getElementById('visualknowledge-img');
    const configurationalKnowledgeImg = document.getElementById('configurationalknowledge-img');
    const proceduralKnowledgeIframe = document.getElementById('proceduralknowledge-iframe');

    // Tüm görselleri ve iframe'leri gizle
    visualKnowledgeImg.style.display = 'none';
    configurationalKnowledgeImg.style.display = 'none';
    proceduralKnowledgeIframe.style.display = 'none';
    iframeContainer.classList.add('d-none');

    if (nodeName === "Conceptual Knowledge") {
        iframeContainer.classList.remove('d-none');
        loadObservableHQChart();
    }

    if (nodeName === "Visual Knowledge") {
        visualKnowledgeImg.style.display = 'block';
    } else if (nodeName === "Configurational Knowledge") {
        configurationalKnowledgeImg.style.display = 'block';
    } else if (nodeName === "Procedural Knowledge") {
        proceduralKnowledgeIframe.style.display = 'block';
    }

    if (nodeName === "Configurational Knowledge") {
        // GoJS diagramını gösterme işlemi
        document.getElementById('configurationalknowledge-img').style.display = 'block';
        init(); // Diagramı yeniden başlatmak için
    }

    if (validNodes.includes(nodeName)) {
        pdfContainer.style.display = validNodes.includes(nodeName) ? 'block' : 'none';
        pdfContainer.style.width = '40%';
        pdfContainer.style.height = '715px';
        document.getElementById('pdf-frame').src = 'https://papers.cumincad.org/data/works/att/ecaadesigradi2019_376.pdf';
    } else {
        pdfContainer.style.display = 'none';
    }
}

// Fetch data and create the chart
document.addEventListener('DOMContentLoaded', function () {
    fetch("json/json5.json")
        .then(response => response.json())
        .then(json5 => {
            createChart(json5);
        })
        .catch(error => console.error("Error loading JSON data:", error));
});

