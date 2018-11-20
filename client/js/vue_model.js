window.vueApp = new Vue({
    el: '#vue-app',
    data: {
        message: 'Hello user!',
        noneSelected: true,
        selectedPage: 1,
        playerDetail: {
            name: "<Player Name>"
        },
        overviewFilters: {},
        selectedMap: 1
    },
    methods: {
        selectPage: function(x){
            this.selectedPage = x;
            if (x == 1){
                initPage1();
            }
            if (x == 2){
                initPage2();
            }
            if (x == 3){
                initPage3();
            }
        }
    },
    mounted: function(){
        console.log("Mounted");
        loadD3();
        loadJquery();
    }
});