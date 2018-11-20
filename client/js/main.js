window.data = null;
window.maxOriginCount = 0;
window.minOriginCount = 10000;
function loadD3(){
    d3.csv("data/airports.csv", function(error, airports) {
        window.airportsMap = {};
        var count = 0;
        airports.map(x => {
            count++;
            window.airportsMap[x.IATA_CODE] = x;
            window.airportsMap[x.IATA_CODE]["id"] = count;
        });
        d3.csv("data/flights1.csv", function(error, flights) {
            console.log(flights);
            window.flights = flights;
            d3.csv("data/states.csv", function(error, states) {
                console.log(states);
                window.stateMap = {};
                states.map(x => {
                    window.stateMap[x.Abbreviation] = {state:x.State, origin: 0, dest: 0};
                    window.stateMap[x.State] = x.Abbreviation;
                });
                populateStatePopulation();
                getGeoJsonCollection();

                //Get Max, Min Per Capita Flight Availibity
                var maxVal = 0;
                var minVal = 1000;
                for (var stateFeature of statesData.features){
                    var stateName = stateFeature.properties.name;
                    var state1= stateMap[stateMap[stateName]];
                    var originCount = (state1)?state1.origin:0;
                    var popDensity = stateFeature.properties.density;
                    var value = originCount/popDensity;
                    maxVal = Math.max(maxVal, value);
                    minVal = Math.min(minVal, value);
                }
                window.maxPerCapita = maxVal;
                window.minPerCapita = minVal;


                initMap();
                initMap2("mapid2");
                initMap2("mapid3", true);
            });
        });
    });
}



function populateStatePopulation(){
    for(var flight of flights){
        var stateItem = stateMap[airportsMap[flight["ORIGIN_AIRPORT"]]["STATE"]];
        if (stateItem){
            stateItem.origin += 1;
            window.maxOriginCount = Math.max(maxOriginCount, stateItem.origin);
            window.minOriginCount = Math.min(minOriginCount, stateItem.origin);
        }
        
        var destItem = stateMap[airportsMap[flight["DESTINATION_AIRPORT"]]["STATE"]];
        if (destItem)
        destItem.dest += 1;
    }
    console.log(stateMap);
}

function getGeoJsonCollection(){
    window.geoJsonFeatureCollection = {
        type: 'FeatureCollection',
        features: []
    };
    flights.map(function(flight) {
        var origin = airportsMap[flight["ORIGIN_AIRPORT"]];
        var dest = airportsMap[flight["DESTINATION_AIRPORT"]];
        if (!parseFloat(origin["LONGITUDE"]) || !parseFloat(origin["LATITUDE"])
        || !parseFloat(dest["LONGITUDE"]) || !parseFloat(dest["LATITUDE"])){
            return;
        }
    geoJsonFeatureCollection.features.push( {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(origin["LONGITUDE"]),parseFloat(origin["LATITUDE"])]
        },
        properties: {
            "origin_id": origin["id"],
            "origin_city": origin["CITY"],
            "origin_state": stateMap[origin["STATE"]],
            "origin_country": origin["COUNTRY"],
            "origin_lon": parseFloat(origin["LONGITUDE"]),
            "origin_lat": parseFloat(origin["LATITUDE"]),
            "destination_id": dest["id"],
            "destination_city": dest["CITY"],
            "destination_state": stateMap[dest["STATE"]],
            "destination_country": dest["COUNTRY"],
            "destination_lon": parseFloat(dest["LONGITUDE"]),
            "destination_lat": parseFloat(dest["LATITUDE"])
        }
      });
    })
}