var startLocation = [41.06812073522929, 28.80712749218404],

    map = L.map('map', {fullscreenControl: true}).setView([startLocation[0], startLocation[1]], 16),
    osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map),

    outerPolylines = [], //Polylines for Outside the Polygon
    innerPolylines = [], //Polylines for Inside the Polygon
    polygons = drawArea(), //Polygon Areas

    markers = [], //Markers (Users)
    outerCoord = [[]], //Polyline Coordinates for Outside the Polygon
    innerCoord = [[[[]]]], //Polyline Coordinates for Inside the Polygon
    inx = [], //Represent Indexes from "innerCoord" | [i][0] Index1, Represent Polylines | [i][1] Index2, Represent Polyline Points
    time = [], //Timers | [i][0] Represent Second | [i][1] Represent Minute | [i][2] Represent Hour
    entDate = [], //Last Date Markers Entered an Area
    lastArea = [], //Last Visited Areas
    control = false; //Marker - Polygon Contains Controller
    
// map.on('click', function(e) { 
//    alert(e.latlng.lat + ", " + e.latlng.lng);
// });

if(!navigator.geolocation){ //Geolocation Support Control (Not necessary as we don't use geolocation for now)
    console.log("No Browser Support"); 
} else {
    walk(10, 10, 100, 8000, polygons);
}

function walk(n, lineLength, intervalRate, dist, polygons){ //Move Function
    for (i = 0; i < n; i++) {
        markers.push(L.marker([startLocation[0], startLocation[1]], {title: "User " + i}));
        markers[i].addTo(map);
        
        outerPolylines.push(L.polyline([[0, 0], [0, 0]], {color: 'rgba(255, 0, 0, 0.6)', className: 'outer-polyline'}));
        innerPolylines.push(L.polyline([[0, 0], [0, 0]], {color: 'rgba(0, 0, 0, 0.6)', className: 'inner-polyline'}));
        outerCoord.push([[]]);
        innerCoord.push([[[]]]);
        inx.push([0, 0]);
        time.push(-1);
        entDate.push(-1);
        lastArea.push(-1);

    } outerCoord.shift(); innerCoord.shift();

    for (i = 0; i < n; i++) {
        outerCoord[i].shift();
        for(j = 0; j < (lineLength + 1); j++)
            outerCoord[i].push([startLocation[0], startLocation[1]]);
    } 

    setInterval(() => {
        for (q = 0; q < n; q++) {
            var lastAreaNum = lastArea[q],
                lastAreaTime = "";
                
            if(lastAreaNum === -1 ) lastAreaNum = "";

            if(typeof time[q][0] === "undefined") lastAreaTime = "";
            else lastAreaTime = time[q][3] + "h " + time[q][2] + "min " + time[q][1] + "sec";

            markers[q].bindPopup("<b>"  +markers[q].options.title+"'s Device Location</b><br/>Latitude: " + outerCoord[q][lineLength][0] + "<br/> Longitude: " + outerCoord[q][lineLength][1] + "<br/> Last Visited Area:" + lastAreaNum + "<br/> Last Time Spent in Area: " + lastAreaTime);

            control = isContain(polygons, q);
        
            markers[q].addTo(map);
            for (i = 0; i < n; i++) {
                outerPolylines[i].addTo(map);
                innerPolylines[i].addTo(map);
            }
        
            for (i = 0; i < lineLength; i++)
                for(j = 0; j < 2; j++)
                    outerCoord[q][i][j] = outerCoord[q][i + 1][j];

            var latV = (Math.random()) / dist,
                lonV = (Math.random()) / dist,
            direction = Math.floor(Math.random() * 20);
            if (direction > 7) direction = Math.floor(Math.random() * 4); //Reduce the Chance of Going Straight
            switch (direction) {
                case 0: outerCoord[q][lineLength][0] += latV; outerCoord[q][lineLength][1] += lonV; break; //Northeast
                case 1: outerCoord[q][lineLength][0] -= latV; outerCoord[q][lineLength][1] -= lonV; break; //Southwest
                case 2: outerCoord[q][lineLength][0] += latV; outerCoord[q][lineLength][1] -= lonV; break; //Northwest
                case 3: outerCoord[q][lineLength][0] -= latV; outerCoord[q][lineLength][1] += lonV; break; //Southeast
                case 4: outerCoord[q][lineLength][0] += latV; break; //North
                case 5: outerCoord[q][lineLength][0] -= latV; break; //South
                case 6: outerCoord[q][lineLength][1] += lonV; break; //East
                case 7: outerCoord[q][lineLength][1] -= lonV; break; //West
            }
    
            if (isContain(polygons, q) !== -1) { //Permanent Polyline
                innerCoord[q][inx[q][0]][inx[q][1]] = ([outerCoord[q][lineLength][0], outerCoord[q][lineLength][1]]);
                inx[q][1]++;

                markers[q].setLatLng(innerCoord[q][inx[q][0]][innerCoord[q][inx[q][0]].length - 1]);
                innerPolylines[q].setLatLngs(innerCoord[q]);
                outerPolylines[q].setLatLngs(0, 0);

            } else { //Temporary Polyline
                markers[q].setLatLng(outerCoord[q][lineLength]);
                outerPolylines[q].setLatLngs(outerCoord[q]);

            }

            if (control === -1 && isContain(polygons, q) !== -1) { //Entering the Polygon
                entDate[q] = new Date();
                lastArea[q] = isContain(polygons, q);

            } if (control !== -1 && isContain(polygons, q) === -1) { //Going Out from Polygon
                time[q] = getAreaTime(new Date().getTime() - entDate[q].getTime(), [1000, 60, 60]);
                lastAreaTime = time[q][3] + "h " + time[q][2] + "min " + time[q][1] + "sec"; 
                
                innerCoord[q].push([[]]);
                inx[q][0]++; inx[q][1] = 0;

            }
        }
    }, intervalRate);
}

function isContain(polygons, j) {
    for(i = 0; i < polygons.length; i++)
            if (polygons[i].contains(markers[j].getLatLng())) return i;

    return -1;
}

function getAreaTime(baseValue, timeFractions) { //Clock
    var data = [baseValue];
    for (i = 0; i < timeFractions.length; i++) {
        data.push(parseInt(data[i] / timeFractions[i]));
        data[i] = data[i] % timeFractions[i]; //timeFractions [1000, 60, 60] | Inx0 = Millisecond, 1 = Second, 2 = Minute, 3 = Hour
    }

    return data;
}

function drawArea() { //Area
    var polygonLatlngs = [[[41.0697429223744, 28.808513195580787], //Coordinates for Polygons
                           [41.0697429223744, 28.80996130994058],
                           [41.067885138094944, 28.80996130994058],
                           [41.067885138094944, 28.80787430940058],
                           [41.06822472099828, 28.807881574194127],
                           [41.06822472099828, 28.809574271091257],
                           [41.06871218373997, 28.809574271091257],
                           [41.06871218373997, 28.808513195580787]],

                          [[41.06749894364841, 28.80433202507794],
                           [41.067358716772375, 28.80825478362011],
                           [41.066479104942516, 28.808220966736027],
                           [41.066612959666045, 28.80428129975705]],
                            
                          [[41.07020774886032, 28.80849301188299],
                           [41.068852289267156, 28.805596395803942],
                           [41.07220323574246, 28.803598729542536]]],
    polygons = [];
    for (i = 0; i < polygonLatlngs.length; i++) {
        var polygon = new L.polygon(polygonLatlngs[i], {color: 'rgb(0, 200, 0)', title: 'Area ' + i, className: 'area-polygon'});
        polygons.push(polygon);
        polygons[i].addTo(map);
    }

    return polygons;
}