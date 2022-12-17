<script>
export default {
    props: ['onClickGo'],
    data() {
        return { inputText: '' }   
    },
    methods: {
        handleGoButton() {
            this.onClickGo(this.inputText)
        }
    }
}   
</script>

<template>
    <div class="grid-x grid-padding-x" style="height:min-content">
      <input class="cell small-8" type="text" v-model="inputText" />
      <button class="cell auto button" @click="handleGoButton">Go</button>
    </div>
</template>