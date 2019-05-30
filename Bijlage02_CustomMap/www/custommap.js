;(function() {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    let isDown = false;
    let lastKnownMouseX = 0;
    let lastKnownMouseY = 0;

    const body = document.getElementsByTagName("BODY")[0];
    body.addEventListener("mousedown", mouseDown);
    body.addEventListener("mouseup", mouseUp);
    body.addEventListener("mousemove", mouseMove);
    body.addEventListener("touchstart", mouseDown);
    body.addEventListener("touchend", mouseUp);
    body.addEventListener("touchmove", mouseMove);
    body.addEventListener("wheel", wheelScroll);
    window.addEventListener('resize', windowResize);

    const mc = new Hammer.Manager(body);
    const pinch = new Hammer.Pinch();
    mc.add(pinch);

    let scalingOnPinchStart = 0;
    mc.on("pinchstart", pinchStart);
    mc.on("pinchin", pinchIn);
    mc.on("pinchout", pinchOut);

    const mapWidth = 1396;
    const mapHeight = 1129;
    let currentMapWidth = mapWidth;
    let currentMapHeight = mapHeight;
    let currentCenterX = 0;
    let currentCenterY = 0;

    const plusIcon = document.getElementById("plusIcon");
    const minIcon = document.getElementById("minIcon");
    plusIcon.addEventListener("click", zoomIn);
    minIcon.addEventListener("click", zoomOut);

    const upIcon = document.getElementById("upIcon");
    const downIcon = document.getElementById("downIcon");
    const leftIcon = document.getElementById("leftIcon");
    const rightIcon = document.getElementById("rightIcon");
    upIcon.addEventListener("click", moveUp);
    downIcon.addEventListener("click", moveDown);
    leftIcon.addEventListener("click", moveLeft);
    rightIcon.addEventListener("click", moveRight);

    const bubbles = document.getElementById("bubbles");
    const bubbleArr = [
        {
            id: 1,
            name: "Lorem Ipsum",
            icon: '<i class="fas fa-utensils"></i>',
            x: 650,
            y: 170
        }
    ];

    let scaling = 1;
    createBubbles();
    centerImageDefault();

    function windowResize() {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        
        centerImage(currentCenterX, currentCenterY);
    }

    function getDefaultScale() {
        const xMax = (windowWidth / mapWidth);
        const yMax = (windowHeight / mapHeight);
        
        return (xMax > yMax ? yMax : xMax); // Return the smallest max-scaling
    }

    function createBubbles() {
        for (i = 0; i < bubbleArr.length; i++) { 
            const bubble = bubbleArr[i];

            const element = document.createElement("div");
            element.className = "bubble";
            element.id = "bubble_"+bubble.id;
            element.innerHTML = bubble.icon;
            bubbles.appendChild(element);
        }
    }

    function drawMap(xOffset, yOffset) {
        body.style.backgroundSize = currentMapWidth+"px "+currentMapHeight+"px";

        body.style.backgroundPosition = xOffset+"px "+yOffset+"px";

        for (i = 0; i < bubbleArr.length; i++) { 
            const bubble = bubbleArr[i];
            const element = document.getElementById("bubble_"+bubble.id);

            const width = element.offsetWidth;
            const height = element.offsetHeight;

            const x = (bubble.x*scaling)+xOffset-(width/2);
            const y = (bubble.y*scaling)+yOffset-(height/2);

            element.style.left = x+"px";
            element.style.top = y+"px";
        }
    }

    function centerImageDefault() {
        scaling = getDefaultScale();

        currentMapWidth = mapWidth*scaling;
        currentMapHeight = mapHeight*scaling;

        const centerX = mapWidth/2;
        const centerY = mapHeight/2;

        currentCenterX = centerX;
        currentCenterY = centerY;

        centerImage(centerX, centerY);
    }

    function centerImage(xPos, yPos) {
        const xOffset = 0-(xPos * scaling)+(windowWidth/2);
        const yOffset = 0-(yPos * scaling)+(windowHeight/2);

        drawMap(xOffset, yOffset);
    }

    function zoom(scale) {
        currentMapWidth = mapWidth*scale;
        currentMapHeight = mapHeight*scale;

        centerImage(currentCenterX, currentCenterY);
    }
    
    function zoomIn() {
        scaling = scaling*1.3;
        
        zoom(scaling);
    }

    function zoomOut() {
        scaling = scaling/1.3;
        
        zoom(scaling);
    }

    function moveUp() {
        currentCenterY -= (90/scaling);

        centerImage(currentCenterX, currentCenterY);
    }

    function moveDown() {
        currentCenterY += (90/scaling);

        centerImage(currentCenterX, currentCenterY);
    }

    function moveLeft() {
        currentCenterX -= (90/scaling);

        centerImage(currentCenterX, currentCenterY);
    }

    function moveRight() {
        currentCenterX += (90/scaling);

        centerImage(currentCenterX, currentCenterY);
    }

    function mouseDown(event) {
        // event.preventDefault();
        // event.stopPropagation();

        isDown = true;

        if (event.clientX != undefined) {
            lastKnownMouseX = event.clientX;
            lastKnownMouseY = event.clientY;
        } else {
            lastKnownMouseX = event.touches[0].clientX;
            lastKnownMouseY = event.touches[0].clientY;
        }
    }

    function mouseUp(event) {
        // event.preventDefault();
        // event.stopPropagation();

        isDown = false;
    }

    function mouseMove(event) {
        // event.preventDefault();
        // event.stopPropagation();

        if (isDown) {
            let diffX = 0;
            let diffY = 0;

            if (event.clientX != undefined) {
                diffX = lastKnownMouseX - event.clientX;
                diffY = lastKnownMouseY - event.clientY;

                lastKnownMouseX = event.clientX;
                lastKnownMouseY = event.clientY;
            } else {
                diffX = lastKnownMouseX - event.touches[0].clientX;
                diffY = lastKnownMouseY - event.touches[0].clientY;

                lastKnownMouseX = event.touches[0].clientX;
                lastKnownMouseY = event.touches[0].clientY;
            }

            currentCenterX += (diffX / scaling);
            currentCenterY += (diffY / scaling);
            centerImage(currentCenterX, currentCenterY);
        }
    }

    function wheelScroll(event) {
        if (event.deltaY > 0) {
            zoomOut();
        } else {
            zoomIn();
        }
    }

    function pinchStart() {
        scalingOnPinchStart = scaling;
    }

    function pinchIn(event) {
        scaling = scalingOnPinchStart * event.scale;

        zoom(scaling);
    }

    function pinchOut(event) {
        scaling = scalingOnPinchStart * event.scale;

        zoom(scaling);
    }
})();