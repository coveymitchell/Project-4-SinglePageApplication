<script>
import $ from 'jquery'
import CrimeMarkerPopup from './components/CrimeMarkerPopup.vue';
import SearchBar from './components/SearchBar.vue';
import Legend from './components/Legend.vue'
import { 
    isAddress, 
    isCoordinate, 
    parseCoordinates, 
    isInBounds,
    clamp, 
    getCoordinatesFromAddress,
    getCoordinatesFromIncident,
    rangeToList
} from './map-page.js'

export default {
    data() {
        return {
            view: "map",
            codes: [],
            neighborhoods: [],
            incidents: [],
            leaflet: {
                map: null,
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: { lat: 45.008206, lng: -93.217977 },
                    se: { lat: 44.883658, lng: -92.993787 }
                },
                neighborhood_markers: [
                    { location: [44.942068, -93.020521], marker: null },
                    { location: [44.977413, -93.025156], marker: null },
                    { location: [44.931244, -93.079578], marker: null },
                    { location: [44.956192, -93.060189], marker: null },
                    { location: [44.978883, -93.068163], marker: null },
                    { location: [44.975766, -93.113887], marker: null },
                    { location: [44.959639, -93.121271], marker: null },
                    { location: [44.9477, -93.128505], marker: null },
                    { location: [44.930276, -93.119911], marker: null },
                    { location: [44.982752, -93.14791], marker: null },
                    { location: [44.963631, -93.167548], marker: null },
                    { location: [44.973971, -93.197965], marker: null },
                    { location: [44.949043, -93.178261], marker: null },
                    { location: [44.934848, -93.176736], marker: null },
                    { location: [44.913106, -93.170779], marker: null },
                    { location: [44.937705, -93.136997], marker: null },
                    { location: [44.949203, -93.093739], marker: null }
                ]
            },
            // map page
            mapPage: {
                search: "",
                selectedIncident: null,
                showIncidentPopup: false,

                table: {
                    legend: [
                        { color: "red", meaning: "Violent" },
                        { color: "green", meaning: "Property" },
                        { color: "yellow", meaning: "Other" } 
                    ]
                },
                searchFilter: {
                    incidentTypes: [
                        { isChecked: true, name: "Narcotics", codes: rangeToList(1800, 1899) },
                        { isChecked: true, name: "Theft", codes: rangeToList(600, 699) },
                        { isChecked: true, name: "Burglary", codes: rangeToList(500, 599) },
                        { isChecked: true, name: "Auto Theft", codes: rangeToList(700, 799) },
                        { isChecked: true, name: "Agg. Assault", codes: rangeToList(400, 499) },
                        { isChecked: true, name: "Property Damage", codes: rangeToList(1400, 1499) },
                        { isChecked: true, name: "Simple Assault", codes: rangeToList(800, 899) },
                        { isChecked: true, name: "Discharge", codes: rangeToList(2619, 2619) },
                        { isChecked: true, name: "Robbery", codes: rangeToList(300, 399) },
                        { isChecked: true, name: "Arson", codes: rangeToList(900, 999) },
                        { isChecked: true, name: "Rape", codes: rangeToList(200, 299) },
                        { isChecked: true, name: "Codes 0-199", codes: rangeToList(0, 199) },
                        { isChecked: true, name: "Codes 1000-1399", codes: rangeToList(1000, 1399) },
                        { isChecked: true, name: "Codes 1500-1799", codes: rangeToList(1500, 1799) }
                    ],
                    // todo: these should be generated from REST api. 
                    // todo might need to add 'code' attribute to each item
                    neighborhoods: [
                        { isChecked: true, name: "Summit-University"},
                        { isChecked: true, name: "Saint Anthony Park"},
                        { isChecked: true, name: "Como Park"},
                        { isChecked: true, name: "North End"},
                        { isChecked: true, name: "Payne-Phalen"},
                        { isChecked: true, name: "Greater East Side"},
                        { isChecked: true, name: "Hameline-Midway"},
                        { isChecked: true, name: "Frogtown"},
                        { isChecked: true, name: "Dayton's Bluff"},
                        { isChecked: true, name: "Southeast"},
                        { isChecked: true, name: "Union Park"},
                        { isChecked: true, name: "Downtown"},
                        { isChecked: true, name: "Macalester-Groveland"},
                        { isChecked: true, name: "Summit Hill"},
                        { isChecked: true, name: "West Seventh-Fort Road"},
                        { isChecked: true, name: "West Side"},
                        { isChecked: true, name: "Highland"},
                    ],
                    startDate: "2014-08-14",
                    endDate: "2022-11-14",
                    limit: 1000
                }
            },
            
            

            //Submission form info
            caseNumber: '',
            date: '',
            time: '',
            code: '',
            incident: '',
            policeGrid: '',
            neighborhoodNumber: '',
            block: ''
        };
    },
    methods: {
        viewMap(event) {
            this.view = "map";
        },
        viewNewIncident(event) {
            this.view = "new_incident";
        },
        viewAbout(event) {
            this.view = "about";
        },
        getCodes() {
            return this.getJSON('http://localhost:8000/codes')
        },
        getNeighborhoods() {
            return this.getJSON('http://localhost:8000/neighborhoods')
        },
        getColorFromCode(incidentCode){
            if((incidentCode >=200 && incidentCode <=299) || (incidentCode >=400 && incidentCode <=499) || (incidentCode >=800 && incidentCode <=899) ){ //violent crimes
                return "lightcoral";
            } else if((incidentCode >=300 && incidentCode <=399) || (incidentCode >=500 && incidentCode <=699) || (incidentCode >=900 && incidentCode <=999) ||(incidentCode >=1400 && incidentCode <=1499)){ //property crimes
                return "lightgreen";
            } 
            return "lightgoldenrodyellow";
            
        },
        getIncidents(incidentCodes=null, neighborhoodCodes=null, limit=null) {
            let conditions = []
            let query = ''

            if (incidentCodes !== null && incidentCodes.length > 0) {
                for (let incidentCode of incidentCodes) {
                    conditions.push(`code=${incidentCode}`)
                }
            }
            if (neighborhoodCodes !== null && neighborhoodCodes.length > 0) {
                for (let neighborhoodCode of neighborhoodCodes) {
                    conditions.push(`neighborhood=${neighborhoodCode}`)
                }
            }
            if (limit !== null) {
                conditions.push(`limit=${limit}`)
            }
            if (conditions.length !== 0) {
                query = '?' + conditions.join('&')
            }
            return this.getJSON(`http://localhost:8000/incidents${query}`)
        },
        submitForm() {
            axios.put('/api/update-incident', {
                caseNumber: this.caseNumber,
                date: this.date,
                time: this.time,
                code: this.code,
                incident: this.incident,
                policeGrid: this.policeGrid,
                neighborhoodNumber: this.neighborhoodNumber,
                block: this.block
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
        },

        getJSON(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: "json",
                    url: url,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({ status: status.status, message: status.statusText });
                    }
                });
            });
        },
        uploadJSON(method, url, data) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: method,
                    url: url,
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    dataType: "text",
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({ status: status.status, message: status.statusText });
                    }
                });
            });
        },
        /**
         * Adds leaflet marker from https://github.com/pointhi/leaflet-color-markers
         * @param {Number} lat 
         * @param {Number} lng 
         * @param {String} color any of the color names listed in the link above
         * @param {boolean} large
         */
         addMarker(lat, lng, color='blue', onClick=null) {
            let large = false
            let size = large ? '-2x' : ''
            let filename = `marker-icon${size}-${color}.png`
            let icon = new L.Icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/${filename}`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })

            let marker = L.marker([lat, lng], { icon: icon }).addTo(this.leaflet.map)
            if (onClick !== null) {
                marker.on('click', onClick)
            }
        },
        flyTo(coordinate) {
            let zoom = this.leaflet.map.getMaxZoom()
            let bounds = this.leaflet.bounds
            let clampedCoord = clamp(coordinate, bounds)
            this.leaflet.map.flyTo(clampedCoord, zoom)
        },
        onMapMoveOrZoom(lat, lng) {
            this.mapPage.search = `${lat}, ${lng}`
            this.leaflet.center.lat = lat
            this.leaflet.center.lng = lng
        },
        onClickGo(search) {
            if (isCoordinate(search)) {
                this.flyTo(parseCoordinates(search))
                return
            }
            if (isAddress(search)) {
                getCoordinatesFromAddress(search)
                .then((coord) => {
                    this.flyTo(coord)
                })
                .catch((err) => {
                    alert(`${search} not a valid address`)
                    console.log(err);
                })
                return
            }
            alert(`invalid search: ${search}`)
        },
        onDeleteIncident(incident) {
            // todo delete incident
            this.mapPage.showIncidentPopup = false
        },
        onSelectIncidentFromTable(incident) {            
            console.log(incident);
            getCoordinatesFromIncident(incident)
            .then(coord => {
                this.addMarker(coord.lat, coord.lng, 'red', () => { this.onSelectIncidentFromMap(incident) })
            })
            .catch(err => { 
                this.onSelectIncidentFromMap(incident) 
                alert("could not place marker on map")
            })

        },
        onSelectIncidentFromMap(incident) {
            window.scrollTo(0, 0)
            this.mapPage.selectedIncident = incident
            this.mapPage.showIncidentPopup = true 
        },
        onClickSearchIncidents() {
            let incidentCodes = this.mapPage.searchFilter.incidentTypes.flatMap(incident => incident.codes)
            console.log(incidentCodes);
            let neighborhoodCodes = null
            this.getIncidents(null, null, this.mapPage.searchFilter.limit)
            .then(incidents => {
                this.incidents = incidents
                this.formSubmitted = true
            })
        },
    },
    mounted() {
        this.leaflet.map = L.map("leafletmap").setView([this.leaflet.center.lat, this.leaflet.center.lng], this.leaflet.zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
            minZoom: 11,
            maxZoom: 18
        }).addTo(this.leaflet.map);
        this.leaflet.map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
        let district_boundary = new L.geoJson();
        district_boundary.addTo(this.leaflet.map);
        this.getJSON("/data/StPaulDistrictCouncil.geojson").then((result) => {
            // St. Paul GeoJSON
            $(result.features).each((key, value) => {
                district_boundary.addData(value);
            });
        }).catch((error) => {
            console.log("Error:", error);
        });

        this.leaflet.map.on('moveend', () => {
            let latLng = this.leaflet.map.getCenter()
            this.onMapMoveOrZoom(latLng.lat, latLng.lng)
        })

        Promise.all([
            this.getCodes(),
            this.getNeighborhoods(),
        ])
        .then(([codes, neighborhoods]) => {
            this.codes = codes
            this.neighborhoods = neighborhoods
        })
        .catch(err => console.log("failed to retrieve data from REST server", err))
        this.onClickSearchIncidents();
    },
    components: { SearchBar, CrimeMarkerPopup, Legend }
}
</script>

<template>
    <!-- Popup Container -->
    <div 
        class="popup-container" 
        v-if="mapPage.showIncidentPopup && mapPage.selectedIncident !== null" 
        @click="this.mapPage.showIncidentPopup=false"
    >
        <CrimeMarkerPopup 
            v-bind:date="this.mapPage.selectedIncident.date_time.split('T')[0]"
            v-bind:time="this.mapPage.selectedIncident.date_time.split('T')[1]"
            v-bind:incident="this.mapPage.selectedIncident.incident"
            v-if="mapPage.showIncidentPopup && mapPage.selectedIncident !== null" 
            @click:delete="onDeleteIncident(this.mapPage.selectedIncident)"
        />
    </div>
    
    <!-- Top Bar -->
    <div class="grid-container">
        <div class="grid-x grid-padding-x">
            <p :class="'cell small-4' + ((view === 'map') ? 'selected' : 'unselected')" @click="viewMap" id="aboutPara">Map</p>
            <p :class="'cell small-4' + ((view === 'new_incident') ? 'selected' : 'unselected')" @click="viewNewIncident" id="aboutPara">New Incident</p>
            <p :class="'cell small-4' + ((view === 'about') ? 'selected' : 'unselected')" @click="viewAbout" id="aboutPara">About</p>
        </div>
    </div>

    <!-- Map Page -->
    <div v-show="view === 'map'" @keyup.enter="onClickGo(this.mapPage.search)">
        <div class="grid-container">
            <!-- Map -->
            <div class="grid-y grid-padding-y">
                <div id="leafletmap" class="cell"></div>
                <SearchBar 
                    class="cell"
                    v-model:search="mapPage.search"
                    @click:go="onClickGo"
                />
            </div>


            
            <!-- Search Filters -->
            <div>
                <h6>Incident Type</h6>
                <ul class="noBulletPoints">
                    <li v-for="incidentType in mapPage.searchFilter.incidentTypes">
                        <label>
                            <input 
                                type="checkbox" 
                                value="{{ incidentType.label }}" 
                                v-model=incidentType.isChecked
                            />
                            {{ incidentType.name }}
                        </label>
                    </li>
                </ul>

                <h6>Neighborhood</h6>
                <ul class="noBulletPoints">
                    <li v-for="neighborhood in mapPage.searchFilter.neighborhoods">
                        <label>
                            <input 
                                type="checkbox"
                                value="{{ neighborhood.label }}" 
                                v-model=neighborhood.isChecked
                            />
                            {{ neighborhood.name }}
                        </label>
                    </li>
                </ul>

                <h6>Start Date</h6>
                <input 
                    type="date"
                    min="2014-08-14"
                    max="2022-11-15"
                    v-model=mapPage.searchFilter.startDate
                />

                <h6>End Date</h6>
                <input 
                    type="date"
                    min="2014-08-14"
                    max="2022-11-15"
                    v-model=mapPage.searchFilter.startDate
                />

                <h6>Max Number of Incidents</h6>
                <input 
                    type="number"
                    min="1"
                    max="1000"
                    v-model="mapPage.searchFilter.limit"
                />

                <button class="button" @click="this.onClickSearchIncidents">Search Incidents</button>
            </div>

            <!--Table-->
            <Legend :legendEntries="this.mapPage.table.legend" />
            <table>
                <thead>
                    <tr>
                        <th>Case Number</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Code</th>
                        <th>Incident</th>
                        <th>Police Grid</th>
                        <th>Neighborhood</th>
                        <th>Block</th>
                    </tr>
                </thead>
                <tbody>
                    <tr 
                        class="clickable"
                        v-for="incident in this.incidents" v-bind:id="incident.code"
                        :style="{ 'background-color': getColorFromCode(incident.code) }"
                        @click="this.onSelectIncidentFromTable(incident)"                      
                    >
                        <td>{{ incident.case_number }}</td>
                        <td>{{ incident.date }}</td>
                        <td>{{ incident.time }}</td>
                        <td>{{ incident.code }}</td>
                        <td>{{ incident.incident }}</td>
                        <td>{{ incident.police_grid }}</td>
                        <td>{{ incident.neighborhood }}</td>
                        <td>{{ incident.block }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- New Incident Page -->
    <div v-if="view === 'new_incident'">
        <!-- Replace this with your actual form: can be done here or by making a new component -->
        <div class="grid-container">
            <div class="grid-x grid-padding-x align-center">
                <form @submit.prevent="submitForm">
                    <label for="case_number">Case Number:</label>
                    <input type="text" v-model="caseNumber" id="case_number" />
                    <br />
                    <label for="date">Date:</label>
                    <input type="date" v-model="date" id="date" />
                    <br />
                    <label for="time">Time:</label>
                    <input type="time" v-model="time" id="time" />
                    <br />
                    <label for="code">Code:</label>
                    <input type="text" v-model="code" id="code" />
                    <br />
                    <label for="incident">Incident:</label>
                    <input type="text" v-model="incident" id="incident" />
                    <br />
                    <label for="police_grid">Police Grid:</label>
                    <input type="text" v-model="policeGrid" id="police_grid" />
                    <br />
                    <label for="neighborhood_number">Neighborhood Number:</label>
                    <input type="text" v-model="neighborhoodNumber" id="neighborhood_number" />
                    <br />
                    <label for="block">Block:</label>
                    <input type="text" v-model="block" id="block" />
                    <br />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    </div>
    <div v-if="view === 'about'">
        <!-- Replace this with your actual about the project content: can be done here or by making a new component -->
        <div class="grid-container">
            <div class="grid-x grid-padding-x align-justify align-center">
                <h1 class="cell auto">About the Project</h1>
            </div>
            <hr>
            <div class="grid-x grid-padding-x align-center">
                <h2 class="cell auto">The Creators</h2>
            </div>
            <hr width = "60%">
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth"> Tim Larson</h3>
                <img src="images/tim_pic.jpg" alt="A picture of Tim with a mall Santa, age 1" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Tim is from North St Paul, Minnesota. His hobbies include video games, cars, and the outdoors. A fun fact about Tim is that he has 
                    had Christmas photos taken with the same mall Santa for the last 21 years. Unfortunately, Santa Sid retired after last year, and thus 
                    the greatest saga of a generation has concluded.
                </p>
            </div>
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth"> Mitchell Covey</h3>
                <img src="images/mitch_pic.jpg" alt="A picture of Mitch" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Mitchell is from New Richmond, Wisconsin. He enjoys rock climbing, skiing, and gaming. Fun fact, Mitchell has road tripped to several national parks
                    including Yellowstone
                </p>
            </div>
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth"> Mike Twohy</h3>
                <img src="images/mike_pic.jpg" alt="A picture of Mike" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Michael is from Roseville, Minnesota. In his free time, he likes to play and write music (both solo and in a band), create apps, and play video games.
                    A fun fact about Michael is that he has a pet tortoise, named Borris. 
                </p>
            </div>
            <hr>
            <div class="grid-x grid-padding-x align-center">
                <h2 class="cell auto">Frameworks and APIs Used </h2>
            </div>
            <hr width = "60%">
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth">St. Paul Police Data API </h3>
                <img src="images/st_paul_logo.png" alt="The St Paul City logo" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    This API was created by Tim, Mitch, and Mike to access information from the St. Paul Crime database. The API includes
                    routes to get codes, neighborhoods, and incidents with various options for data filtration, like codes by number or incidents by neighborhood.
                    Additionally, the API allows for users to create or delete incidents as needed.
                </p>
            </div>
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth">Foundation CSS Framework</h3>
                <img src="images/foundation_logo.png" alt="The Foundation CSS logo" class="cell small-12 medium-8 large-3" id="aboutImg"> 
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    A Framework for any device, medium, and accessibility. Foundation is a family of responsive front-end frameworks that make it easy to 
                    design beautiful responsive websites, apps and emails that look amazing on any device. Foundation is semantic, readable, flexible, 
                    and completely customizable. We are constantly adding new resources and code snippets, including these handy HTML templates to help 
                    get you started!
                </p>
            </div>
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth">Vue.js</h3>
                <img src="images/vue_logo.png" alt="The Vue.js logo" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Vue is a JavaScript framework for building user interfaces. It builds on top of standard HTML, 
                    CSS, and JavaScript and provides a declarative and component-based programming model that helps you efficiently develop user 
                    interfaces, be they simple or complex.
                </p>
            </div>
            <hr>
            <div class="grid-x grid-padding-x align-center">
                <h2 class="cell auto">Interesting Findings</h2>
            </div>
            <hr width = "60%">
            <div class="grid-x grid-padding-x">
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Police Code Meanings</h4>
                    <p id="aboutPara">
                    When researching how to color code the crime types based on police codes, an interesting thing that I learned is that there are 
                    no standardized ways of creating police codes, each state, county, or city could do something totaly different than the neighboring
                    department.
                    </p>
                </div>
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Police Code Order </h4>
                    <p id="aboutPara">
                    Another interesting finding related to police codes is that they are not necessarily sequential, for example, 863 is the 
                    code for a type of domestic assault, a violent crime, and so is 451. However, 600 is a theft code, so the assault types are 
                    not next to each other.
                    </p>
                </div>
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Finding Title</h4>
                    <p id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                </div>
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Finding Title</h4>
                    <p id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                </div>
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Finding Title</h4>
                    <p id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                </div>
                <div class="cell small-12 medium-6 large-4">
                    <h4 id="abouth"> Finding Title</h4>
                    <p id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                </div>
            </div>
            <hr>
            <div class="grid-x grid-padding-x align-center">
                <h2 class="cell auto">Video Demo </h2>
            </div>
            <hr width = "60%">
            <div class="grid-x grid-padding-x">
                <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                
            </div>
            <br>
            <br>
            <br>
        </div>
    </div>
</template>

<style>
#leafletmap {
    height: 500px;
}

.selected {
    background-color: rgb(10, 100, 126);
    color: white;
    border: solid 1px white;
    text-align: center;
    cursor: pointer;
}
.unselected {
    background-color: rgb(200, 200, 200);
    color: black;
    border: solid 1px white;
    text-align: center;
    cursor: pointer;
}
.error {
    color: red;
}
</style>