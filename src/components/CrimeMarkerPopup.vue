<script>
export default {
    props: ['date', 'time', 'incident'],
    emits: ['click:delete', 'click:cancel']
}   
</script>

<template>
    <div class="popup" >
    <p class="popup-header">Incident Report</p>
    <p><span>Date: </span>{{date}}</p>
    <p><span>Time: </span>{{time}}</p>
    <p><span>Incident: </span>{{incident}}</p>
    <div class="button-container">
        <button 
            class="button button-color secondary" 
            @click="$emit('click:cancel')"
        >Cancel</button>

        <div style="width: 2.5%;"></div> 

        <button 
            class="button button-color alert" 
            @click="$emit('click:delete')"
        >Delete</button>
    </div>
    </div>

</template>

<style>
.popup {
    background-color: white;
    z-index: 1000;
    padding: 0px 10px;
    width: 20rem;
    border: .005rem solid;
    border-radius: 0.25rem;

    display: flex;
    flex-direction: column;
    align-items: left;
    justify-content: space-between;
}

.popup-header {
    font-weight: bold;
    font-size: larger;
    align-self: center;
}

.button-container {
    display: flex;
    align-items: left;
    justify-content: end;
}

p span {
    font-weight: bold;
}

</style>