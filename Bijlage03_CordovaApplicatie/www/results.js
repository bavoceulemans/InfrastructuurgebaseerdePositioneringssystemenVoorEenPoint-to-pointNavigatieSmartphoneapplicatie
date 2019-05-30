let datapoints;

;(function() {
    let map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1
    });
    
    let lines = [];
    let kalmanlines = [];
    let status = [];

    let height = 0;
    let width = 0;
    let img = new Image();
    img.onload = function() {
        height = this.height;
        width = this.width;
        console.log(height);

        const bounds = [[0,0], [height, width]];
        // const image = L.imageOverlay('https://dev.foubert.eu/bavo/Lokeren.png', bounds).addTo(map);
        const image = L.imageOverlay('https://find-my-burger.eu-gb.mybluemix.net/SintNiklaas.png', bounds).addTo(map);
        // const image = L.imageOverlay('http://localhost:4000/Lokeren.png', bounds).addTo(map);

        map.fitBounds(bounds);
        loadData();
    }
    // img.src = 'https://dev.foubert.eu/bavo/Lokeren.png';
    img.src = 'https://find-my-burger.eu-gb.mybluemix.net/SintNiklaas.png';
    // img.src = 'http://localhost:4000/Lokeren.png';

		function onDeviceReady()
		{
            
        }

        function loadData() {
        L.marker([height-317, 925]).addTo(map)
        L.marker([height-597, 522]).addTo(map)
        L.marker([height-555, 904]).addTo(map)

        // Parse JSON string into object
        // fetch("https://find-my-burger.eu-gb.mybluemix.net/results/datapoints.json")
        // fetch("http://localhost/FindMyBurger/www/datapoints(realsimulation).json")
        fetch("http://localhost/FindMyBurger/www/datapoints.json")
            .then(res => res.json())
            .then((out) => {
                const datapoints = out[2]["data"];

                drawLine(1, 551.2279052734375, 462.942626953125, '#E6194B', '#800000', datapoints);
                drawLine(2, 740, 541, '#3CB44B', '#AAFFC3', datapoints);
                drawLine(3, 741, 478, '#4363D8', '#000075', datapoints);
                drawLine(4, 838.0092163085938, 329.06451416015625, '#FFE119', '#808000', datapoints);
            })
            .catch(err => { throw err });
        }

        function drawLine(id, x, y, color, colorKalman, datapoints) {
            const real = getPointArray(datapoints, x, y, true);
            // const kalman = getPointArray(datapoints, x, y, false);
            lines[id] = L.polyline(real, {color: color});
            // kalmanlines[id] = L.polyline(kalman, {color: colorKalman});
            status[id] = false;
            L.marker([height-y, x], {
                icon: L.divIcon({
                    html: '<span><i class="fas fa-arrow-right" style="color: '+color+'; font-size: 200%;"></i></span>'
                })
            }).addTo(map).on('click', function(e) {
                if (status[id]) {
                    map.removeLayer(lines[id]);
                    // map.removeLayer(kalmanlines[id]);
                } else {
                    lines[id].addTo(map);
                    // kalmanlines[id].addTo(map);
                }

                status[id] = !status[id];
            });
        }

        function getPointArray(arr, x, y, real) {
            let ret = [];
            arr.forEach(p => {
                if (p.x_dest == x && p.y_dest == y) {
                    if (real) {
                        ret.push([height-p.y, p.x]);
                    } else {
                        ret.push([height-p.y_kalman, p.x_kalman]);
                    }
                }
            });
            return ret;
        }

		function onBackButtonDown()
		{
			evothings.eddystone.stopScan();
			navigator.app.exitApp();
		}

		// This calls onDeviceReady when Cordova has loaded everything.
		document.addEventListener('deviceready', onDeviceReady, false);

		// Add back button listener (for Android).
		document.addEventListener('backbutton', onBackButtonDown, false);
})();