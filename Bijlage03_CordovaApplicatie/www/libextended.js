;(function() {
    let map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1
	});

    let height = 0;
    let width = 0;
    let img = new Image();
    img.onload = function() {
        height = this.height;
        width = this.width;

        const bounds = [[0,0], [height, width]];
        const image = L.imageOverlay('http://localhost:4000/SintNiklaas.png', bounds).addTo(map);

        map.fitBounds(bounds);
    }
    img.src = 'http://localhost:4000/SintNiklaas.png';

    map.on('click', OnClick);
    let status = 0;
    let startPos;
    let endPos;
    let start;
    let end;
    let polyline;
    let savedPath;
    let savedPixelsPerMeter = 1;
    function OnClick(e) {
        if (status == 0) {
            setEnd(e.latlng.lng, height-e.latlng.lat);

            status++;
        } else if (status == 1) {
            const x = e.latlng.lng;
            const y = height-e.latlng.lat;

            setLocation(x, y);
        }
    }
    // autoMover();

    function autoMover() {
        setTimeout(function(){ setEnd(162, 1501) }, 2000);
        setTimeout(function(){ setLocation(668, 1121) }, 3000);
        setTimeout(function(){ setLocation(672, 1075) }, 4500);
        setTimeout(function(){ setLocation(672, 1031) }, 5000);
        setTimeout(function(){ setLocation(672, 985) }, 5000);
        setTimeout(function(){ setLocation(674, 951) }, 5500);
        setTimeout(function(){ setLocation(676, 913) }, 6000);
        setTimeout(function(){ setLocation(676, 887) }, 6500);
        setTimeout(function(){ setLocation(684, 851) }, 7000);
        setTimeout(function(){ setLocation(706, 835) }, 7500);
        setTimeout(function(){ setLocation(742, 815) }, 8000);
        setTimeout(function(){ setLocation(806, 799) }, 8500);
        setTimeout(function(){ setLocation(782, 797) }, 10000);
        setTimeout(function(){ setLocation(712, 803) }, 10500);
        setTimeout(function(){ setLocation(660, 801) }, 11000);
        setTimeout(function(){ setLocation(598, 803) }, 11500);
    }

    function setEnd(x, y) {
        console.log(x);
        console.log(y);
        console.log("");
        endPos = {
            y: y,
            x: x
        };

        end = L.marker([height-endPos.y, endPos.x], {
            icon: L.icon.fontAwesome({
                iconClasses: 'fas fa-stop',
                markerColor: '#FF5555',
                iconColor: '#FFF'
            })
        }).bindPopup("Endpoint").addTo(map);
    }

    function setLocation(x, y) {
        console.log(x);
        console.log(y);
        console.log("");
        let degree = 0;

        if (startPos != undefined) {
            degree = getAngle(startPos.x, startPos.y, x, y);
            degree = Math.round(degree);
        }

        startPos = {
            y: y,
            x: x
        };

        if (start != undefined) {
            map.removeLayer(start);
        }
        
        start = L.marker([height-startPos.y, startPos.x], {
            icon: L.divIcon({
                html: '<span><i class="fas fa-arrow-right" style="color: #55FF55; font-size: 200%; transform: rotate('+degree+'deg);"></i></span>'
            })
        }).addTo(map);
        
        setTimeout(function(){ checkLoadPath(startPos, endPos); }, 10);
    }

    function checkLoadPath(startPos, endPos) {
        const maxMeters = 5;
        const maxPixels = maxMeters * savedPixelsPerMeter;

        let shortestDistance = 999999;
        if (savedPath != undefined) {
            savedPath.forEach(step => {
                const distInPixels = dist(startPos.x, startPos.y, step.x, step.y);
                if (distInPixels < shortestDistance) {
                    shortestDistance = distInPixels;
                }
            });
        }

        if (shortestDistance > maxPixels) {
            loadPath(startPos, endPos);
        }
    }

    async function loadPath(startPos, endPos) {
        const data = await postData(`http://localhost:4000/path`, {
            start: JSON.stringify(startPos),
            end: JSON.stringify(endPos)
        });
        
        savedPath = data.path;
        savedPixelsPerMeter = data.pixelsPerMeter;
        
        drawPolyline(startPos, endPos, data.path, "blue");
    }

    function drawPolyline(startPos, endPos, path, color) {
        let latlngs = [];
        latlngs.push([height-startPos.y, startPos.x]);
        path.forEach(step => {
            latlngs.push([height-step.y, step.x]);
        });
        latlngs.push([height-endPos.y, endPos.x]);
        if (polyline != undefined) {
            map.removeLayer(polyline);
        }
        polyline = L.polyline(latlngs, {color: color}).addTo(map);
    }

    function postData(url = ``, data = {}) {
        // Default options are marked with *
          return fetch(url, {
              method: "POST", // *GET, POST, PUT, DELETE, etc.
              mode: "cors", // no-cors, cors, *same-origin
              cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
              credentials: "same-origin", // include, *same-origin, omit
              headers: {
                  "Content-Type": "application/json",
                  // "Content-Type": "application/x-www-form-urlencoded",
              },
              redirect: "follow", // manual, *follow, error
              referrer: "no-referrer", // no-referrer, *client
              body: JSON.stringify(data), // body data type must match "Content-Type" header
          })
          .then(response => response.json()); // parses response to JSON
      }

      function getAngle(originX, originY, targetX, targetY) {
        var dx = originX - targetX;
        var dy = originY - targetY;
        
        // var theta = Math.atan2(dy, dx);  // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = west
        // theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; clockwise; 0° = west
        // if (theta < 0) theta += 360;     // [0, 360]; clockwise; 0° = west
        
        // var theta = Math.atan2(-dy, dx); // [0, Ⲡ] then [-Ⲡ, 0]; anticlockwise; 0° = west
        // theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; anticlockwise; 0° = west
        // if (theta < 0) theta += 360;     // [0, 360]; anticlockwise; 0° = west
        
        // var theta = Math.atan2(dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; anticlockwise; 0° = east
        // theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; anticlockwise; 0° = east
        // if (theta < 0) theta += 360;     // [0, 360]; anticlockwise; 0° = east
        
        var theta = Math.atan2(-dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = east
        theta *= 180 / Math.PI;           // [0, 180] then [-180, 0]; clockwise; 0° = east
        if (theta < 0) theta += 360;      // [0, 360]; clockwise; 0° = east
        
        return theta;
    }

    function diff (num1, num2) {
        if (num1 > num2) {
          return (num1 - num2);
        } else {
          return (num2 - num1);
        }
      };
      
      function dist (x1, y1, x2, y2) {
        var deltaX = diff(x1, x2);
        var deltaY = diff(y1, y2);
        var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        return (dist);
      };
})();