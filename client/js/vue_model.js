window.vueApp = new Vue({
    el: '#vue-app',
    data: {
        message: 'Hello user!',
        noneSelected: true,
        selectedState: "",
        playerDetail: {
            name: "<Player Name>"
        },
        overviewFilters: {},
        selectedMap: 1
    },
    mounted: function(){
        loadD3();
    }
});