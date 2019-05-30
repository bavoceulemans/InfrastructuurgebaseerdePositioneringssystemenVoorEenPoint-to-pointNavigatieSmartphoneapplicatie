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
        const image = L.imageOverlay('SintNiklaas.png', bounds).addTo(map);

        map.fitBounds(bounds);
    }
    img.src = 'SintNiklaas.png';

    map.on('click', OnClick);
    let status = 0;
    let startPos;
    let endPos = undefined;
    let xFilter;
    let yFilter;
    let start;
    let end;
    let polyline;
    let savedPath;
    let savedPixelsPerMeter = 16;
    function OnClick(e) {
        if (status == 0) {
            setEnd(e.latlng.lng, height-e.latlng.lat);

            // status++;
        } else if (status == 1) {
            const x = e.latlng.lng;
            const y = height-e.latlng.lat;

            setLocation(x, y);
        }
    }

    function setEnd(x, y) {
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
                html: '<span><i class="fas fa-arrow-right"'+
                ' style="color: #55FF55;font-size: 200%; transform: rotate('+degree+'deg);"></i></span>'
            })
        }).addTo(map);
        
        if (endPos != undefined) {
         setTimeout(function(){ checkLoadPath(startPos, endPos); }, 10);
        }
    }

    function checkLoadPath(startPos, endPos) {
        const maxMeters = 10;
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
        const data = await postData(`https://find-my-burger.eu-gb.mybluemix.net/path`, {
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
      
      function dist(x1, y1, x2, y2) {
        var deltaX = diff(x1, x2);
        var deltaY = diff(y1, y2);
        var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        return (dist);
      };

      //***************************************************************************************************** */
      //
      //
      // **********************
      // BEACONSHIT STARTS HERE
      // **********************
      //
      //
      //***************************************************************************************************** */
      
        var beaconLocations = {
            "0A 0A 0A 0A 0A 0A 0A 0A 0A 0A": {
                x: 925,
                y: 317,
                r: 0,
            },
            "0B 0B 0B 0B 0B 0B 0B 0B 0B 0B": {
                x: 522,
                y: 597,
                r: 0,
            },
            "0C 0C 0C 0C 0C 0C 0C 0C 0C 0C": {
                x: 904,
                y: 555,
                r: 0,
            },
            "0D 0D 0D 0D 0D 0D 0D 0D 0D 0D": {
                x: 617,
                y: 684,
                r: 0,
            },
        };

        var circles = [];
	
		// Dictionary of beacons.
		var beacons = {};
		var kfs = {};

		// Timer that displays list of beacons.
		var timer = null;
		var history = [];

		function onDeviceReady()
		{
			console.log('Device is ready');
            kfs["value"] = new KalmanFilter();
            xFilter = new KalmanFilter();
            yFilter = new KalmanFilter();
            startButton();
		}

		function startButton() {
			// Start tracking beacons!
			setTimeout(startScan, 50);

			// Timer that refreshes the display.
			timer = setInterval(updateBeaconList, 2000);
		}

		function onBackButtonDown()
		{
			evothings.eddystone.stopScan();
			navigator.app.exitApp();
		}

		function startScan()
		{
			showMessage('Scan in progress.');
			evothings.eddystone.startScan(
				function(beacon)
				{
					// Update beacon data.
					beacon.timeStamp = Date.now();
					beacons[beacon.address] = beacon;
					if (kfs[beacon.address] == undefined) {
						kfs[beacon.address] = new KalmanFilter();
					}
				},
				function(error)
				{
					showMessage('Eddystone scan error: ' + error);
				});
		}

		// Map the RSSI value to a value between 1 and 100.
		function mapBeaconRSSI(rssi)
		{
			if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
			if (rssi < -100) return 100; // Max RSSI
			return 100 + rssi;
		}

		function getSortedBeaconList(beacons)
		{
			var beaconList = [];
			for (var key in beacons)
			{
				beaconList.push(beacons[key]);
			}
			beaconList.sort(function(beacon1, beacon2)
			{
				return mapBeaconRSSI(beacon1.rssi) < mapBeaconRSSI(beacon2.rssi);
			});
			return beaconList;
		}

		function updateBeaconList()
		{
			removeOldBeacons();
            // displayBeacons();
            updatePosition();
		}

		function removeOldBeacons()
		{
			var timeNow = Date.now();
			for (var key in beacons)
			{
				// Only show beacons updated during the last 5 seconds.
				var beacon = beacons[key];
				if (beacon.timeStamp + 5000 < timeNow)
				{
					delete beacons[key];
				}
			}
        }

        function getRndInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1) ) + min;
        }
        
        async function updatePosition() {
            let points = [];
            var sortedList = getSortedBeaconList(beacons);
			for (var i = 0; i < sortedList.length; ++i)
			{
                var beacon = sortedList[i];
                htmlBeaconRSSIKalman(beacon);

                const name = uint8ArrayToString(beacon.nid).toUpperCase().trim();
                const distance = htmlBeaconDistance(beacon);

                let position = beaconLocations[name];
                position.r = distance * savedPixelsPerMeter;
                console.log(name+": "+position.r+" ("+distance+"m)");

                points.push(position);

                if (circles[name] != undefined) {
                    map.removeLayer(circles[name]);
                    circles[name] = undefined;
                }
                circles[name] = L.circle([height-position.y, position.x], position.r).addTo(map);
            }
            
            const data = await postData(`https://find-my-burger.eu-gb.mybluemix.net/trilaterate`, {beacons: JSON.stringify(points)});
            meanp = data.point;

            if (meanp != null) {
                const newX = xFilter.filter(meanp.x);
                const newY = yFilter.filter(meanp.y);

                setLocation(newX, newY);
            } else {
                // setLocation(0, 0);
            }
        }

		function uint8ArrayToString(uint8Array)
		{
			function format(x)
			{
				var hex = x.toString(16);
				return hex.length < 2 ? '0' + hex : hex;
			}

			var result = '';
			for (var i = 0; i < uint8Array.length; ++i)
			{
				result += format(uint8Array[i]) + ' ';
			}
			return result;
		}

		function htmlBeaconDistance(beacon)
		{
			var dist = 0;
			if (beacon.kalman >= -84) {
				dist = 5;
			} else if (beacon.kalman >= -89) {
				dist = 10;
			} else if (beacon.kalman >= -91) {
				dist = 15;
			} else {
                dist = 20;
            }
			return dist;
		}

		function htmlBeaconRSSIKalman(beacon)
		{
			beacon.kalman = kfs[beacon.address].filter(beacon.rssi);
			return beacon.rssi ?
				beacon.kalman :  0;
		}

		function showMessage(text)
		{
			console.log(text);
		}

		// This calls onDeviceReady when Cordova has loaded everything.
		document.addEventListener('deviceready', onDeviceReady, false);

		// Add back button listener (for Android).
		document.addEventListener('backbutton', onBackButtonDown, false);
})();