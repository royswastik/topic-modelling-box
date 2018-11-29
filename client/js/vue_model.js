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
                initPage1(window.global_data);
            }
            if (x == 2){
                initPage2(window.global_data);
            }
            if (x == 3){
                initPage3(window.global_data);
            }
            if (x == 4){
                initPage4(window.global_data);
            }
        }
    },
    mounted: function(){
        console.log("Mounted");
        loadD3();
        loadJquery();
    }
});