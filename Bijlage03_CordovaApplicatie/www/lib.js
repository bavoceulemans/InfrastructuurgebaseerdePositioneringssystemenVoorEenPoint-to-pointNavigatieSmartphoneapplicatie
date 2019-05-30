;(function() {
    let map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1
	});

    let height = 0;
    let width = 0;
    var img = new Image();
    img.onload = function() {
        height = this.height;
        width = this.width;

        const bounds = [[0,0], [height, width]];
        const image = L.imageOverlay('SintNiklaas.png', bounds).addTo(map);

        map.fitBounds(bounds);
    }
    img.src = 'SintNiklaas.png';

    map.on('click', OnClick);
    let status = 0;
    var startPos;
    var stopPos;
    function OnClick(e) {
        if (status == 0) {
            startPos = {
                y: height-e.latlng.lat,
                x: e.latlng.lng
            };

            var start = L.marker([height-startPos.y, startPos.x], {
                icon: L.icon.fontAwesome({
                    iconClasses: 'fas fa-play',
                    markerColor: '#55FF55',
                    iconColor: '#FFF'
                })
            }).bindPopup("Startpoint").addTo(map);

            status++;
        } else if (status == 1) {
            endPos = {
                y: height-e.latlng.lat,
                x: e.latlng.lng
            };

            var end = L.marker([height-endPos.y, endPos.x], {
                icon: L.icon.fontAwesome({
                    iconClasses: 'fas fa-stop',
                    markerColor: '#FF5555',
                    iconColor: '#FFF'
                })
            }).bindPopup("Startpoint").addTo(map);
            
            status++;
        } else if (status == 2) {
            loadPath(startPos, endPos);
            
            status++;
        }
    }

    async function loadPath(startPos, endPos) {
        const data = await postData(`http://localhost:4000/path`, {
            start: JSON.stringify(startPos),
            end: JSON.stringify(endPos)
        });

        console.log(data);
        // drawPolyline(startPos, endPos, data.waypoints, "red");
        drawPolyline(startPos, endPos, data.path, "blue");
        // drawPolyline(startPos, endPos, data.allpoints, "green");
    }

    function drawPolyline(startPos, endPos, path, color) {
        var latlngs = [];
        latlngs.push([height-startPos.y, startPos.x]);
        path.forEach(step => {
            latlngs.push([height-step.y, step.x]);
        });
        latlngs.push([height-endPos.y, endPos.x]);
        const polyline = L.polyline(latlngs, {color: color}).addTo(map);
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
})();