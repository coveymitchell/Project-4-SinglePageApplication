import { createApp } from 'vue'
import App from './App.vue'
import { onClickGo } from './map-page';

let init = false;

function initializeApp() {
    if (!init) {
        let app = createApp(App).mount('#app');
    }
    init = true;
}

window.initializeApp = initializeApp;
