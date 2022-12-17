<script>
export default {
    props: ['search'],
    emits: ['update:search', `click:go`]
}   
</script>

<template>
    <div class="grid-x grid-padding-x" style="height:min-content">
      <input 
        class="cell small-10" 
        type="text" 
        :value="search"
        @input="$emit('update:search', $event.target.value)"
      />
      <button 
        class="cell auto button" 
        @click="$emit('click:go', this.search)"
      >Go</button>
    </div>
</template>