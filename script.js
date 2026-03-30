let countries = [];
let targetCountry = null;
let currentMode = 'daily';
let guessCount = 0;
const MAX_GUESSES = 5;

// Data for the special hints (can be expanded)
const extraHints = {
    "France": { cap: "Paris", land: "No", star: "Napoleon" },
    "Switzerland": { cap: "Bern", land: "Yes", star: "Roger Federer" },
    "Japan": { cap: "Tokyo", land: "No", star: "Hokusai" },
    "USA": { cap: "Washington D.C.", land: "No", star: "George Washington" },
    "Brazil": { cap: "Brasilia", land: "No", star: "Pelé" },
    "Germany": { cap: "Berlin", land: "No", star: "Albert Einstein" },
    "Mongolia": { cap: "Ulaanbaatar", land: "Yes", star: "Genghis Khan" },
    "Egypt": { cap: "Cairo", land: "No", star: "Cleopatra" }
};

async function init() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
        const data = await response.json();
        countries = data.features.filter(d => d.properties.name);
        
        const datalist = document.getElementById('country-list');
        countries.forEach(c => {
            let opt = document.createElement('option');
            opt.value = c.properties.name;
            datalist.appendChild(opt);
        });
        setMode('daily');
    } catch (e) {
        document.getElementById('message').innerText = "Load Error.";
    }
}

function setMode(mode) {
    currentMode = mode;
    guessCount = 0;
    document.getElementById('guess-history').innerHTML = "";
    document.getElementById('hint-list').innerHTML = "";
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('message').innerText = "";
    document.getElementById('controls').style.display = "block";
    updateCounter();

    if (mode === 'daily') {
        const today = new Date().toISOString().slice(0, 10);
        const seed = xmur3(today)();
        targetCountry = countries[seed % countries.length];
    } else {
        targetCountry = countries[Math.floor(Math.random() * countries.length)];
    }
    renderMap(targetCountry);
}

function renderMap(feature) {
    const container = d3.select("#map-container");
    container.selectAll("*").remove();
    const projection = d3.geoMercator().fitSize([280, 220], feature);
    const path = d3.geoPath().projection(projection);
    container.append("svg").attr("width", 300).attr("height", 250).append("path").datum(feature).attr("d", path);
}

function checkGuess() {
    const input = document.getElementById('guess-input');
    const name = input.value.trim();
    const guessed = countries.find(c => c.properties.name.toLowerCase() === name.toLowerCase());

    if (!guessed) return;

    guessCount++;
    updateCounter();
    
    const dist = calculateDistance(guessed, targetCountry);
    const pct = Math.max(0, 100 - Math.floor((dist / 16000) * 100));
    const angle = calculateAngle(guessed, targetCountry);
    
    addHistory(guessed.properties.name, Math.round(dist), pct, angle);
    processHints();

    if (name.toLowerCase() === targetCountry.properties.name.toLowerCase()) {
        endGame(true);
    } else if (guessCount >= MAX_GUESSES) {
        endGame(false);
    }
    input.value = "";
}

function processHints() {
    const box = document.getElementById('hint-box');
    const list = document.getElementById('hint-list');
    const cName = targetCountry.properties.name;
    const info = extraHints[cName] || { cap: "Unknown", land: "Unknown", star: "Famous Figure" };

    if (guessCount >= 3) {
        box.classList.remove('hidden');
        if (guessCount === 3) addHintItem(`Capital City: ${info.cap}`);
        if (guessCount === 4) addHintItem(`Landlocked: ${info.land}`);
        if (guessCount === 5) addHintItem(`Famous Person: ${info.star}`);
    }
}

function addHintItem(text) {
    const li = document.createElement('li');
    li.innerText = text;
    document.getElementById('hint-list').appendChild(li);
}

function endGame(win) {
    document.getElementById('controls').style.display = "none";
    const msg = document.getElementById('message');
    msg.innerText = win ? "✅ SUCCESS!" : `❌ GAME OVER! It was ${targetCountry.properties.name}`;
    msg.style.color = win ? "#538d4e" : "#e10303";
}

function updateCounter() {
    document.getElementById('guess-counter').innerText = `Guesses: ${guessCount}/${MAX_GUESSES}`;
}

function addHistory(name, dist, pct, angle) {
    const row = document.createElement('div');
    row.className = 'guess-row';
    const arrows = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
    const arrow = arrows[Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8];
    row.innerHTML = `<span>${name}</span><span>${dist}km</span><span>${arrow}</span><span class="proximity-pct">${pct}%</span>`;
    document.getElementById('guess-history').prepend(row);
}

function calculateDistance(c1, c2) { return d3.geoDistance(d3.geoCentroid(c1), d3.geoCentroid(c2)) * 6371; }
function calculateAngle(c1, c2) { 
    const p1 = d3.geoCentroid(c1), p2 = d3.geoCentroid(c2);
    return (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI;
}
function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 345227121), h = h << 13 | h >>> 19;
    return function() { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }
}

init();
