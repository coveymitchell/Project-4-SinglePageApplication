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
                        { isChecked: true, name: "Narcotics", filter: (code) => code >= 1800 && code <= 1885 }
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
            incident_url: "",
            case_number: "",
            date: "",
            time: "",
            code: "",
            incident: "",
            police_grid: "",
            neighborhood: "",
            block: "",
            formSubmitted: false
        };
    },
    computed: {
        filteredIncidents() {
            return this.incidents.filter(incident => {
                true
            })
        },
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
        getIncidents(neighborhoodCode=null, limit=null) {
            let conditions = []
            let query = ''

            if (neighborhoodCode !== null) {
                conditions.push(`neighborhood=${neighborhoodCode}`)
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
            this.formSubmitted = true
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
        onSelectIncident(incident) {
            // todo show marker on map
            this.mapPage.showIncidentPopup = true
        },
        onClickSearchIncidents() {
            this.getIncidents(null, this.mapPage.searchFilter.limit)
            .then(incidents => {
                this.incidents = incidents
                this.formSubmitted = true
            })
        }
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
            let TEMP_LIMIT = 10 // todo add to model
            this.codes = codes
            this.neighborhoods = neighborhoods
            return this.getIncidents(neighborhoods[0].code, TEMP_LIMIT)
        })
        .then(incidents => {
            this.incidents = incidents
            console.log(incidents);
        })
        .catch(err => console.log("failed to retrieve data from REST server"))
        
    },
    components: { SearchBar, CrimeMarkerPopup, Legend }
}
</script>

<template>
    <!-- Popup Container -->
    <div 
        class="popup-container" 
        v-if="mapPage.showIncidentPopup" 
        @click="this.mapPage.showIncidentPopup=false"
    >
        <CrimeMarkerPopup 
            date="12-17-2021"
            time="12:07pm"
            incident="Hello World!"
            v-if="mapPage.showIncidentPopup" 
            @click:delete="onDeleteIncident(null)"
        />
    </div>
    
    <!-- Top Bar -->
    <div class="grid-container">
        <div class="grid-x grid-padding-x">
            <p :class="'cell small-4' + ((view === 'map') ? 'selected' : 'unselected')" @click="viewMap">Map</p>
            <p :class="'cell small-4' + ((view === 'new_incident') ? 'selected' : 'unselected')" @click="viewNewIncident">New Incident</p>
            <p :class="'cell small-4' + ((view === 'about') ? 'selected' : 'unselected')" @click="viewAbout">About</p>
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
                    <tr v-for="incident in this.incidents" v-bind:id="incident.code">
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
                <form @submit.prevent="submitForm" v-if="!formSubmitted">
                <span>Case Number</span><br>
                <input 
                    v-model="case_number"
                    type="number"
                    placeholder="Enter the case number" 
                />
                <span>Date</span><br>
                <input 
                    v-model="date"
                    type="date"
                    placeholder="Enter the date of incident" 
                /><br>
                <span>Time</span><br>
                <input 
                    v-model="time"
                    type="time"
                    placeholder="Enter the time of incident"
                />
                <span>Code</span><br>
                <input 
                    v-model="code"
                    type="number"
                    placeholder="Enter the incident code"
                />
                <span>Incident</span><br>
                <input 
                    v-model="incident"
                    type="text"
                    placeholder="Enter Incident Description"
                />
                <span>Police Grid</span><br>
                <input 
                    v-model="police_grid"
                    type="number"
                    placeholder="Enter the Police Grid"
                />
                <span>Neighborhood</span><br>
                <input 
                    v-model="neighborhood"
                    type="text"
                    placeholder="Enter the Neighborhood"
                />
                <span>Block</span><br>
                <input 
                    v-model="block"
                    type="text"
                    placeholder="Enter the Block"
                />
                <input type="submit" value="Submit"/>
                </form>
                <div v-if="formSubmitted">
                    <h3>Form Submitted</h3>
                    <p>Case Number: {{ case_number }}</p>
                    <p>Date: {{ date }}</p>
                    <p>Time: {{ time }}</p>
                    <p>Code: {{ code }}</p>
                    <p>Incident: {{ incident }}</p>
                    <p>Police Grid: {{ police_grid }}</p>
                    <p>Neighborhood: {{ neighborhood }}</p>
                    <p>Block: {{ block }}</p>
                </div>
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
                <h3 class="cell small-12 medium-3 large-3" id="abouth"> Mitch Covey</h3>
                <img src="images/mitch_pic.jpg" alt="A picture of Mitch" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor 
                    in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                    in culpa qui officia deserunt mollit anim id est laborum. 
                </p>
            </div>
            <div class="grid-x grid-padding-x">
                <h3 class="cell small-12 medium-3 large-3" id="abouth"> Mike Twohy</h3>
                <img src="images/mike_pic.jpg" alt="A picture of Mike" class="cell small-12 medium-8 large-3" id="aboutImg">
                <p class="cell small-12 medium-12 large-3" id="aboutPara">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor 
                    in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                    in culpa qui officia deserunt mollit anim id est laborum. 
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
</style>