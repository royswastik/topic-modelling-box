var mapboxAccessToken = "pk.eyJ1Ijoic3dhc3Rpa3JveSIsImEiOiJjam4yYjhrc2g0dTVkM3BxY3U3bWIyOWZnIn0.h0LB5qI_hPO2mrFG_8zG3A";
var mapBoxUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken;

function initMap(){



    var geoJsonObj;

    var map = L.map('mapid').setView([37.8, -96], 4);
    var selected = "";


    var flightsLayer= L.tileLayer(mapBoxUrl, {
        id: 'mapbox.light',
        attribution: ""
    }).addTo(map);
    flightsLayer.addTo(map);



    // control that shows state info on hover
    var infoBox = L.control();

    infoBox.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    infoBox.update = function (props) {
        var flightCount = (props)?(stateMap[stateMap[props.name]])?stateMap[stateMap[props.name]].origin:"Not Available":"Not Available";
        
        this._div.innerHTML = '<h4>Flights availability</h4>' +  (props ?
            '<b>' + props.name + '</b><br />' + flightCount + ' flights'
            : 'Click on a US state');
    };

    infoBox.addTo(map);

    function mouseOverEvent(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        infoBox.update(layer.feature.properties);
    }

    function mouseOutEvent(e) {
        geoJsonObj.resetStyle(e.target);
        infoBox.update();
    }

    function clickState(e) {
        map.removeLayer(oneToManyFlowmapLayer);
        var newSelected = e.target.feature.properties.name;
        if(newSelected == selected){
            window.vueApp.noneSelected = true;
            window.vueApp.selectedState = "";
            flightsFlow(geoJsonFeatureCollection);
            loadPieData({features: []});
            selected = "";
        }
        else{
            window.vueApp.noneSelected = false;
            window.vueApp.selectedState = newSelected;
            var filteredCollection = filterCollection(e);
            flightsFlow(filteredCollection);
            loadPieData(filteredCollection);
            selected = newSelected;
        }
    }

    function applyEventToEachState(feature, layer) {
        layer.on({
            mouseover: mouseOverEvent,
            mouseout: mouseOutEvent,
            click: clickState
        });
    }

    geoJsonObj = L.geoJson(statesData, {
        onEachFeature: applyEventToEachState
    }).addTo(map);


    flightsFlow(geoJsonFeatureCollection);
    function flightsFlow(geoData){
    window.oneToManyFlowmapLayer = L.canvasFlowmapLayer(geoData, {
            originAndDestinationFieldIds: {
            originUniqueIdField: 'origin_id',
            originGeometry: {
                x: 'origin_lon',
                y: 'origin_lat'
            },
            destinationUniqueIdField: 'destination_id',
            destinationGeometry: {
                x: 'destination_lon',
                y: 'destination_lat'
            }
            },
            pathDisplayMode: 'all',
            animationStarted: true,
            animationEasingFamily: 'Cubic',
            animationEasingType: 'In',
            animationDuration: 2000
        });
        window.oneToManyFlowmapLayer.addTo(map);
    }
  //End init
}

function filterCollection(e){
    var stateName = e.target.feature.properties.name;
    var filteredFeatures = [...geoJsonFeatureCollection.features].filter(x=> {
        return (x.properties.origin_state && x.properties.origin_state.state == stateName);
    });
    let filtered = {
        ...geoJsonFeatureCollection,
        features: filteredFeatures
    }
    return filtered;
}



function initMap2(htmlid, perCapita){
    var geoJsonObject;
    var map = L.map(htmlid).setView([37.8, -96], 4);
    var flightsLayer= L.tileLayer(mapBoxUrl, {
        id: 'mapbox.light',
        attribution: ""
    }).addTo(map);
    flightsLayer.addTo(map);
    var infoBox = L.control();

    infoBox.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    infoBox.update = function (props) {
        var flightCount = (props)?(stateMap[stateMap[props.name]])?stateMap[stateMap[props.name]].origin:"Not Available":"Not Available";
        
        this._div.innerHTML = '<h4>Flights availability</h4>' +  (props ?
            ((perCapita)?('<b>' + props.name + '</b>(Population Density)<br />' + props.density + ' people / mi<sup>2</sup><br />'):'')
            +'<b>Flights</b><br />' + flightCount + ''
            : 'Click on a US state');
    };

    infoBox.addTo(map);


    function visualEncoding(properties) {
        var d = properties.density;
        var flightCount = (stateMap[stateMap[properties.name]])?stateMap[stateMap[properties.name]].origin:minOriginCount;
        var d = flightCount;
        if(perCapita){
            d = flightCount/properties.density;
            d = (d-minPerCapita)/(maxPerCapita - minPerCapita);
        }
        else{
            d = (d-minOriginCount)/(maxOriginCount - minOriginCount);
        }
        d = d * 100;
        return d > 90 ? '#05446d' :
                d > 50  ? '#1a5478' :
                d > 25  ? '#396a89' :
                d > 15  ? '#4b7793' :
                d > 8   ? '#6489a1' :
                d > 3   ? '#7a98ac' :
                d > 1   ? '#b4c2cc' :
                            '#dadee1';
    }

    function mapStylings(feature) {
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7,
            fillColor: visualEncoding(feature.properties)
        };
    }

    let mouseOverEVent = function(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        infoBox.update(layer.feature.properties);
    }


    let mouseOutEvent = function(e) {
        geoJsonObject.resetStyle(e.target);
        infoBox.update();
    };
    var selected = "";
    let clickEvent = function(e) {
        var filteredCollection = filterCollection(e);
        var newSelected = e.target.feature.properties.name;
        if(newSelected == selected){
            window.vueApp.noneSelected = true;
            window.vueApp.selectedState = "";
            loadPieData({features: []});
            selected = "";
        }
        else{
            window.vueApp.noneSelected = false;
            window.vueApp.selectedState = newSelected;
            var filteredCollection = filterCollection(e);
            loadPieData(filteredCollection);
            selected = newSelected;
        }
        
    };
   

    let applyEventsToEachState = function (feature, layer) {
        layer.on({
            mouseover: mouseOverEVent,
            mouseout: mouseOutEvent,
            click: clickEvent
        });
    };

    geoJsonObject = L.geoJson(statesData, {
        style: mapStylings,
        onEachFeature: applyEventsToEachState
    }).addTo(map);
  //End init
}