<script>
export default {
    props: ['legendEntries']
}
</script>

<template>
    <div class="container">
        <table cellspacing="10"  style="margin: auto;" >
            <tr v-for='item in legendEntries'>
                <td>
                    <div class="colorBox" :style="{backgroundColor: item.color}"> </div>
                </td>
                <td>{{ item.meaning }}</td>
            </tr>
        </table>
    </div>
    
</template>

<style>
.container {
    width: min-content;
    height: min-content;
    background-color: white;
    padding: 10px;
    border: 1px solid black;
}

.colorBox {
    width: 20px;
    height: 20px;
    margin: 0px 10px;
    border: 1px solid black;
}

table {
    padding: 0px;
    width: min-content;
    height: min-content;
}

</style>