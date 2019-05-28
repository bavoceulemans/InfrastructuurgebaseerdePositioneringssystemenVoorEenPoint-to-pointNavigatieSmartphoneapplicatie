var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var Jimp = require('jimp');
var fs = require('fs');
var astar = require('./node_modules/javascript-astar/astar.js');
var simplify = require('./node_modules/simplify-js/simplify.js');
var smooth = require('./node_modules/smooth-polyline/dist/smooth-polyline.js');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get( '/', function (req, res) {
    res.json({
        message: "Hello World. De API is functioneel."
    });
})

app.post( '/path', function (req, res) {
    const pixelsPerMeter = 16;
    const pixelsPerHalfMeter = pixelsPerMeter/2;
    imageToGrid("SintNiklaas.png", pixelsPerHalfMeter).then(grid => {
        let start = JSON.parse(req.body.start);
        let end = JSON.parse(req.body.end);

        start.x = Math.floor(start.x/pixelsPerHalfMeter);
        start.y = Math.floor(start.y/pixelsPerHalfMeter);

        end.x = Math.floor(end.x/pixelsPerHalfMeter);
        end.y = Math.floor(end.y/pixelsPerHalfMeter);

        const gridPath = findPath(grid, start, end);
        let allpoints = [];

        gridPath.forEach(function(node) {
            const step = {
                x: node.y*pixelsPerHalfMeter,
                y: node.x*pixelsPerHalfMeter
            }
            allpoints.push(step);
        });
        
        let waypoints = allpoints;
        for (let i = 0; i < 3; i++) {
            waypoints = simplify(waypoints, 5);
        }
        
        let tempsmooth = [];
        waypoints.forEach(function(step) {
            tempsmooth.push([step.x, step.y]);
        });

        for (let i = 0; i < 5; i++) {
            tempsmooth = smooth(tempsmooth);
        }

        let path = [];
        tempsmooth.forEach(function(step) {
            path.push({
                x: step[0],
                y: step[1]
            });
        });

        res.json({
            pixelsPerMeter: pixelsPerMeter,
            path: path,
            waypoints: waypoints,
            allpoints: allpoints
        });
    });
})

app.post('/trilaterate', function(req, res) {
    const points = JSON.parse(req.body.beacons);

    const trilat = trilaterate(points);
    const meanp = meanpoint(trilat);

    res.json({
        point: meanp
    });
});

app.use(express.static(__dirname + '/'));
app.listen(4000)

//************ */
// TRILATERATION
//************ */
function meanpoint(array) {
    if (array.length > 0) {
        let points = array.slice();

        points.forEach(function(p) {
            let totaldiff = 0;
            points.forEach(function(p2) {
                totaldiff += dist(p, p2);
            });
            p.totaldiff = totaldiff;
        });

        points.sort(function(a, b) {return a.totaldiff-b.totaldiff});
        
        return {
            x: points[0].x,
            y: points[0].y,
            r: 0
        }
    } else {
        return null;
    }
}

function dist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2));
}

function trilaterate(points) {
    let arr = [];

    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const int = intersection(points[i].x, points[i].y, points[i].r, points[j].x, points[j].y, points[j].r);
            if (int != null) {
                int.forEach(function(p) {
                    arr.push(p);
                });
            }
        }
    }

    return arr;
}

//https://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci
function intersection(x0, y0, r0, x1, y1, r1) {
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy*dy) + (dx*dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return null;
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return null;
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.  
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    return [{
        x: xi,
        y: yi,
        r: 0
    },{
        x: xi_prime,
        y: yi_prime,
        r: 0
    }]
}

//************ */
// IMAGE-TO-GRID
//************ */
async function imageToGrid(path, minimumPathWidth) {
    let grid = [];
    const image = await Jimp.read(path);

    const width = image.bitmap.width; //  width of the image
    const height = image.bitmap.height; // height of the image

    for (var yi = 0; yi < height; yi += minimumPathWidth) {
        for (var xi = 0; xi < width; xi += minimumPathWidth) {
            const maxXi = (xi+minimumPathWidth < width ? xi+minimumPathWidth : width );
            const maxYi = (yi+minimumPathWidth < height ? yi+minimumPathWidth : height );
            
            let value = 1;
            for (var y = yi; y < maxYi; y++) {
                for (var x = xi; x < maxXi; x++) {
                    let pixel = Jimp.intToRGBA(image.getPixelColor(x, y)); // returns the colour of that pixel e.g. 0xFFFFFFFF
                    if (pixel.r < 200 || pixel.g < 200 || pixel.b < 200) {
                        value = 10000;
                    }
                }
            }

            const matrixX = Math.floor(xi/ minimumPathWidth);
            const matrixY = Math.floor(yi/ minimumPathWidth);
            
            if (grid[matrixY] == undefined) {
                grid[matrixY] = [];
            }
            grid[matrixY][matrixX] = value;
        }
    }
    grid = addBlur(grid);
    return grid;
}

function findPath(grid, start, end) {
    const graph = new astar.Graph(grid, { diagonal: true });
	const startp = graph.grid[start.y][start.x];
	const endp = graph.grid[end.y][end.x];
    const result = astar.astar.search(graph, startp, endp);
    return result;
}

// https://codepen.io/Tyrandus/pen/MoOBap

// Applying blur to the given original pixel grid
function addBlur (original_) {	
	// Creating copy of the original pixel grid 
    let original = original_.slice()
    const maxY = original_.length;
    const maxX = original_[0].length;
	
	// Preparing <px> for the blurred output
	let px = []
	for (var i = 0; i < maxY; i++) {
		px.push([])
	}
	
	for (var i = 0; i < maxY; i++) {
		for (var j = 0; j < maxX; j++) {
			// Retrieving neighbors 
			var neighbors = getNeighbors(original, i, j, maxX, maxY);
			
			px[i][j] = {}
			
			// // Calculating average red, green and blue values of neighbors
			let Sum = neighbors.reduce((acc, cur) => { return acc + cur }, 0) 
            px[i][j] = Math.floor(Sum / neighbors.length);
            if (original[i][j] == 10000) {
                px[i][j] = 10000;
            }
		}
    }
    
    return px;
}

// Finding the neighbors of a cell in a 2D-Array
// as proposed on Stack Overflow by @FryGuy
// https://stackoverflow.com/questions/652106/finding-neighbours-in-a-two-dimensional-array#652123
function getNeighbors (original, i, j, maxX, maxY) {
	let neighbors = [];
	const deltas = [ {x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1},
									{x:-1, y:0},               {x:1, y:0},
									{x:-1, y:1},  {x:0, y:1},  {x:1, y:1} ];

	deltas.forEach(delta => {
		if (i + delta.y < 0 || i + delta.y >= maxY ||
                j + delta.x < 0 || j + delta.x >= maxX) return;
        if (original[i + delta.y][j + delta.x] == 10000) {
            neighbors.push(100);
        }
		neighbors.push(original[i + delta.y][j + delta.x]);
    })
    
    return neighbors;
}