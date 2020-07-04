const MILISECONDS_IN_SECOND = 1000;
const SLICE_SECONDS = 5;
const SLICE_LOCALE = 2;
const UPDATE_DATA_INTERVAL = 600000;
const TOO_EARLY_TO_RUN = 6;
const FAR_TO_CEL1 = 32;
const FAR_TO_CEL2 = 1.8;

const RUN_ZONES = {
    'GREEN_ZONE': 98,
    'L_GREEN_ZONE': 95,
    'NORMAL_ZONE': 92,
    'YELLOW_ZONE': 89,
    'ORANGE_ZONE': 86
}

const RUN_PERFOMANCE_M = {
    '-5' : '96',
    '-4' : '96',
    '-3' : '97',
    '-2' : '97',
    '-1' : '98',
    '0' : '98',
    '1' : '99',
    '2' : '99',
    '3' : '99',
    '4' : '99',
    '5' : '100',
    '6' : '100',
    '7' : '100',
    '8' : '100',
    '9' : '99',
    '10' : '99',
    '11' : '99',
    '12' : '99',
    '13' : '99',
    '14' : '98',
    '15' : '97',
    '16' : '97',
    '17' : '96',
    '18' : '96',
    '19' : '95',
    '20' : '94',
    '21' : '93',
    '22' : '92',
    '23' : '91',
    '24' : '90',
    '25' : '88',
    '26' : '86',
    '27' : '84',
    '28' : '82',
    '29' : '79',
    '30' : '75',
    '31' : '71',
    '32' : '68',
    '33' : '64',
    '34' : '60',
    '35' : '55'
}

const RUN_PERFOMANCE_W = {
    '-5' : '97',
    '-4' : '97',
    '-3' : '97',
    '-2' : '98',
    '-1' : '98',
    '0' : '98',
    '1' : '99',
    '2' : '99',
    '3' : '99',
    '4' : '99',
    '5' : '100',
    '6' : '100',
    '7' : '100',
    '8' : '100',
    '9' : '99',
    '10' : '99',
    '11' : '99',
    '12' : '99',
    '13' : '99',
    '14' : '98',
    '15' : '98',
    '16' : '97',
    '17' : '97',
    '18' : '97',
    '19' : '96',
    '20' : '95',
    '21' : '95',
    '22' : '94',
    '23' : '93',
    '24' : '92',
    '25' : '90',
    '26' : '89',
    '27' : '88',
    '28' : '87',
    '29' : '85',
    '30' : '82',
    '31' : '79',
    '32' : '76',
    '33' : '73',
    '34' : '69',
    '35' : '65'
}

function activatePlacesSearch() {
    let input = document.getElementById('search-autocomplete');
    new google.maps.places.Autocomplete(input);
}

google.maps.event.addDomListener(window, 'load', activatePlacesSearch);

startApp()

function startApp() {
    sendRequest()
    setInterval(() => {
        sendRequest()
    }, UPDATE_DATA_INTERVAL);
}

async function sendRequest () {
    let params = {
        'lat': localStorage.getItem('lat'),
        'lon': localStorage.getItem('lng'),
        'appid': 'APIKEY', // openweathermap API
        'exclude': 'current,minutely,daily',
        'units': localStorage.getItem('units') || 'metric'
    }

    let url = `https://api.openweathermap.org/data/2.5/onecall?` +
            `lat=${params['lat']}&` +
            `lon=${params['lon']}&` + 
            `exclude=${params['exclude']}&` + 
            `units=${params['units']}&` +
            `appid=${params['appid']}`;

    let response = await fetch(url);

    if (response.ok) {
        let json = await response.json();
        let date = new Date();
        let nextDay = new Date();
        nextDay.setDate(date.getDate() + 1);
        const todayContainer = document.querySelector('.today-data');
        const tomorrowContainer = document.querySelector('.tomorrow-data');
        let today = date.getDate();
        let tomorrow = nextDay.getDate();
        addData(json, today, todayContainer);
        addData(json, tomorrow, tomorrowContainer);
    } else {
        console.log('HTTP-Error: ' + response.status);
    }
}

function addData(parsedJson, date, appender) {
    const timezome = parsedJson['timezone']
    if (appender.innerHTML) {
        appender.innerHTML = '';
    }
    for (let hour of parsedJson.hourly) {
        let parsedDate = new Date(hour.dt * MILISECONDS_IN_SECOND);
        let localDate = parsedDate.toLocaleDateString('en-GB', {timeZone: timezome})        
        let localTime = parsedDate.toLocaleTimeString('en-GB', {timeZone: timezome}).slice(0, SLICE_SECONDS);
        if (localStorage.getItem('units') === 'imperial') {
            let timePM = parsedDate.toLocaleTimeString('en-US', {timeZone: timezome})
            localTime = timePM.slice(0, timePM.indexOf(':')) + ':00 ' + timePM.slice(timePM.length - SLICE_LOCALE);
        }
        if (+localTime.slice(0, SLICE_LOCALE) < TOO_EARLY_TO_RUN) {
            continue;
        }
        if (date === +localDate.slice(0, SLICE_LOCALE)) {
            let container = document.createElement('tr');

            let time = document.createElement('th');
            time.setAttribute('scope', 'row');
            time.textContent = localTime;

            let temp = document.createElement('td');
            temp.textContent = hour['temp'].toFixed(1);

            let feelsLike = document.createElement('td');
            feelsLike.textContent = hour['feels_like'].toFixed(1);

            let humidity = document.createElement('td');
            humidity.textContent = hour['humidity'];

            let weather = document.createElement('td');
            weather.setAttribute('class', 'py-0 hide-sm');
            let img = document.createElement('img');
            let imgSource = `https://openweathermap.org/img/wn/${hour['weather'][0]['icon']}@2x.png`;
            img.setAttribute('src', imgSource);
            img.setAttribute('title', hour['weather'][0]['description']);
            img.setAttribute('alt', hour['weather'][0]['description']);
            weather.append(img);
            
            let tempForCalculation = parseInt(hour['feels_like']);
            if (localStorage.getItem('units') === 'imperial') {
                tempForCalculation = parseInt((hour['feels_like'] - FAR_TO_CEL1) / FAR_TO_CEL2);
            }

            let runningIndexM = document.createElement('td');
            runningIndexM.textContent = RUN_PERFOMANCE_M[tempForCalculation] || `WARNING!!!`;
            setColor(runningIndexM, RUN_PERFOMANCE_M[tempForCalculation])

            let runningIndexW = document.createElement('td');
            runningIndexW.textContent = RUN_PERFOMANCE_W[tempForCalculation] || `WARNING!!!`;
            setColor(runningIndexW, RUN_PERFOMANCE_W[tempForCalculation])

            container.append(time, temp, feelsLike, humidity, weather, runningIndexM, runningIndexW);
            appender.append(container);
        }
    }
}

function setColor(tag, level) {
    if (level >= RUN_ZONES['GREEN_ZONE']) {
        tag.setAttribute('style', 'background-color:#66bb6a');
    } else if (level >= RUN_ZONES['L_GREEN_ZONE'] && level < RUN_ZONES['GREEN_ZONE']) {
        tag.setAttribute('style', 'background-color:#81c784');
    } else if (level >= RUN_ZONES['NORMAL_ZONE'] && level < RUN_ZONES['L_GREEN_ZONE']) {
        tag.setAttribute('style', 'background-color:#a5d6a7');
    } else if (level >= RUN_ZONES['YELLOW_ZONE'] && level < RUN_ZONES['NORMAL_ZONE']) {
        tag.setAttribute('style', 'background-color:#fff176');
    } else if (level >= RUN_ZONES['ORANGE_ZONE'] && level < RUN_ZONES['YELLOW_ZONE']) {
        tag.setAttribute('style', 'background-color:#f9a825');
    } else {
        tag.setAttribute('style', 'background-color:#e65100');
    }
}

async function saveLocalStorage () {
    let rad1 = document.querySelector('#inlineRadio1');
    let rad2 = document.querySelector('#inlineRadio2');
    if (rad1.checked) {
        localStorage.setItem('units', 'metric');
    }
    if (rad2.checked) {
        localStorage.setItem('units', 'imperial');
    }

    let cityName = document.querySelector('#search-autocomplete').value;
    localStorage.setItem('city', cityName);

    let [lat, lng] = await getCoordinates(cityName);
    if (lat) {
        localStorage.setItem('lat', lat);
    }
    if (lng) {
        localStorage.setItem('lng', lng);
    }
    sendRequest()
}

function getLocalStorage () {
    let rad1 = document.querySelector('#inlineRadio1');
    let rad2 = document.querySelector('#inlineRadio2');
    if (localStorage.getItem('units') === 'metric') {
        rad1.checked = true;
    } else if (localStorage.getItem('units') === 'imperial') {
        rad2.checked = true;
    }
    let cityName = document.querySelector('#search-autocomplete');
    cityName.value = localStorage.getItem('city') || '';
}

async function getCoordinates (cityName) {
    let params = {
        'address': cityName,
        'appid': 'API_KEY' // Google API key
    }
    
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${params['address']}&key=${params['appid']}`

    let response = await fetch(url);

    if (response.ok) {
        let json = await response.json();
        let coordinates = json['results'][0]['geometry']['location']
        let lat = coordinates['lat'];
        let lng = coordinates['lng'];
        return [lat, lng]
    } else {
        console.log('HTTP-Error: ' + response.status);
    }
}

window.onload = getLocalStorage();
