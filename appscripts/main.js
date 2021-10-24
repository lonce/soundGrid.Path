// main.js
/*
	Click one to play one. Click and drag to create a path. Click a path to play it. Shift-click to add one elmt to a path, CTL-click to remove one elmt from path. ESC or click body to clear a path.
*/
//==========================================================
//==========================================================
// --- For sound grid 

config=document.getElementById("config")
console.log(config)

// Each cell at (row, col) will have a sound file attached to it.
// rowRows*numCols should be the number of files you have in the resources folder.
const numRows=parseInt(config.dataset.rows)
const numCols=parseInt(config.dataset.cols)

// inter onset interval between sound onsets in a sequence,
// if it is equal to your sound file duration, there will be no space between them
// const IOI = 743 // ms, 
const IOI = parseInt(config.dataset.ioi) // ms, 
console.log("IOI is " + IOI)

console.log(` FOR sound NAMES:   ${config.dataset.file2string}`)
let makefnamestring=function(row,col){
	// map (row, col) to file names
	fstring=config.dataset.file2string
	//console.log(`row[${row}], col[${col}] plays  ${eval(fstring)}`)
	return eval(fstring)
}

// ----- for sound paths

/*   //Uncomment if you want to hide the RNNspan on the html page 
if (config.dataset.audiopaths == "")
	document.getElementById("RNNspan").style.display = "none"
*/

console.log(` FOR PATH NAMES:   ${config.dataset.audiopaths}`)
audioPath=[]
audioPath[0]=null;
for(pathNum=1;pathNum<=6;pathNum++){
	pFName=eval(config.dataset.audiopaths)
	audioPath.push(new Audio(pFName))
	console.log(`pathNum[${pathNum}] plays  ${pFName}`)
}

const duration=parseFloat(config.dataset.soundPathSecs)

//==========================================================
//==========================================================

let playlist=[] // list of cells with Audio properties to play 
let playTimer  // ID for timer to set through playList

let lastSelectedCellID=null
let dragging=false

const body = document.getElementById("body");
body.addEventListener('mousedown', function(){
	clearPlaylist()
})
body.addEventListener('mouseup', function(){
	dragging=false
})


const container = document.getElementById("container");


let makeGrid = function(rows, cols) {
  container.style.setProperty('--grid-rows', rows);
  container.style.setProperty('--grid-cols', cols);

  for (let r=0;r<rows;r++){
  	for (let c=0;c<cols;c++){
	    let cell = document.createElement("div");
	    // make row and col numbers visible on cells
	    cell.innerHTML = `${r}/${c}`;
	    cell.style.backgroundColor=cell2colorstring(r,c);

	    // hang info on cell useful in callbacks etc
	    cell.id=`${r}/${c}`;
	    cell.row=r
	    cell.col=c
	    cell.fname=makefnamestring(r,c)
	    cell.audioClip= new Audio(cell.fname);

	    container.appendChild(cell).className = "grid-item";


	    cell.addEventListener('mousedown', function(ev){
	    	//console.log(`r: ${ev.target.row}, c: ${ev.target.col}`)
	    	ev.preventDefault()
		    ev.stopPropagation()
	    	if (ev.target.selected) { // if clicking on a cell already on the playlist
	    		if (ev.ctrlKey){
	    			console.log("Remove this event")
	    			removeOneFromPlaylist(ev.target)
	    		} else {
	    			playTheList()
	    		}
	    	} else {   
	    		 if (ev.shiftKey) {
					addToPlaylist(ev.target)
	    			ev.target.style.backgroundColor= "#FFF";
	    		} else {         // else start a new playlist
			    	//console.log(`fname: ${ev.target.fname}`)
			    	clearPlaylist()
			    	addToPlaylist(ev.target)
			    	dragging=true;
			    	ev.target.style.backgroundColor= "#FFF";
			    }
		    }
	    })

	    cell.addEventListener('mousemove', function(ev){
	    	if (dragging && (ev.target.id != lastSelectedCellID)) {
	    		addToPlaylist(ev.target)
	    		ev.target.style.backgroundColor= "#FFF";
	    	}
	    })

	    cell.addEventListener('mouseup', function(ev){
	    	ev.preventDefault()
		    ev.stopPropagation()	    	
	    	if (ev.shiftKey || ev.ctrlKey) return;
	    	dragging=false

	    	// mouse click on single cell (no playlist) just plays it.
	    	if ((playlist.length==1) && (ev.target.id == lastSelectedCellID)) {
	    		ev.target.audioClip.play()
	    		clearPlaylist()
	    	}
	    })
  	}
  }
}

playCount=0
let scheduleNextPlay=function(i){
	playTimer = setTimeout(function(){ 
		playlist[i-1].style.backgroundColor= "#FFF";
		playlist[i].style.backgroundColor= "#0F0";
		//console.log(`playing sound list number ${i}`)
		playlist[i].audioClip.play();

		if (playlist.length > i+1){  // done playing all sounds on playlist?
			scheduleNextPlay(++i);
		} else { // just set up a call to turn the color when the sound is done playing
			playTimer = setTimeout(function(){
				playlist[i].style.backgroundColor= "#FFF";
			}, IOI);
		}
	 }, IOI);

}

// Plays sounds attached to cells on the list in playlist
let playTheList=function(){
	playlist[0].style.backgroundColor= "#0F0";
	playlist[0].audioClip.play()
	if (playlist.length > 1){
		scheduleNextPlay(1)
	}
}

// Add a cell to the playlist
let addToPlaylist=function(c){
	playlist.push(c)
	c.selected=true
	lastSelectedCellID=c.id
}

// Empties the playlist, turns the playlist cells back to their normal color
let clearPlaylist=function(){
	for (i=playlist.length-1;i>=0;i--){
		playlist[i].selected=false;
		playlist[i].style.backgroundColor=cell2colorstring(playlist[i].row,playlist[i].col)
		playlist.pop();
		lastSelectedCellID=null;

		clearTimeout(playTimer)
	}
}

let removeOneFromPlaylist=function(cell){
	for (i=playlist.length-1;i>=0;i--){
		if (playlist[i]==cell){
			playlist[i].selected=false;
			playlist[i].style.backgroundColor=cell2colorstring(playlist[i].row,playlist[i].col)
			playlist.splice(i, 1);
		}		
		//lastSelectedCellID=null;
	}
}

document.addEventListener('keydown', function (ev) {
  //console.log(` ${ev.code}`);
  switch(ev.key) {
  case "Escape":
  	ev.preventDefault()
	ev.stopPropagation()	    	
    clearPlaylist()
    break;
  case "Control":
  	ev.preventDefault()
	ev.stopPropagation()	    	
    break;

   }
});

document.addEventListener('contextmenu', event => event.preventDefault());
/* 
	These functions map the (row,col) to points on the hue, saturation disk. 
*/

let map=function(x,a,b,m,n) {
	return m + ((x-a)/(b-a))*(n-m)
}

let cartesian2Polar=function(x, y){
    distance = Math.sqrt(x*x + y*y)
    radians = Math.atan2(y,x) //This takes y first
    polarCoor = { distance:distance, radians:radians , degrees: radians* (180/Math.PI)}
    return polarCoor
}

let cell2colorstring=function(row, col){
	x= map(row, 0, numRows, .75, -.75)
	y=map(col,0,numCols,.75, -.75)

	pc=cartesian2Polar(x,y)
	return `hsl(${pc.degrees},${100*pc.distance}%,60%)`
}

// -------------------------------------------------------------
makeGrid(numRows, numCols);
// -------------------------------------------------------------

// -------------------------------------------------------------
// Now let's draw a path on top of the grid
// First we need to position a Raphael paper on top of the grid container

container.style.position="relative"
container.style.top="0px"
container.style.left="0px"
container.style.backgroundColor="black"

paperdiv=document.getElementById("paper")
paperdiv.style.zIndex="10" // Make sure the paper elements always visible on top of the grid
paperdiv.style.position="absolute"
paperdiv.style.pointerEvents = "none";  // let the mouse clicks go back to the grid


console.log(`container has size size ${container.offsetWidth} by ${container.offsetHeight}`)

// Find get paper dimensions
var paper = new Raphael(paperdiv, container.offsetWidth,container.offsetHeight);

// ----- 
//map the cell element ID to is position (at its center) in pixels 
let cellCPos=function(cid){
		let cell = document.getElementById(cid)
		let centerX = cell.offsetLeft+cell.offsetWidth/2
		let centerY = cell.offsetTop+cell.offsetHeight/2
		return {'centerX':centerX, 'centerY': centerY}
}

// ----- 
// @ar : list of cells as an array of [[x,y],[x,y]...], where x,y are cell index values
// return: pathString ready to be a Raphael object path attribute     
let cellList2Path=function(ar){
	let pathString=""
	let cpos, cid;
	for (i=0;i<ar.length;i++){
		cid=`${ar[i][0]}/${ar[i][1]}`
		cpos=cellCPos(cid)
		//console.log(`coord of cell ${ar[i]} is ${cpos.centerX}, ${cpos.centerY}` )
		pathString += `${(i==0) ? "M" : "L"} ${cpos.centerX},${cpos.centerY}`
	}
	return pathString
}

//---------------------------
// Create the paper, the path, and the circle that moves along the path
// Path Info
var myPath=null;
var startPath=null;
var cir=null;
var currentPath=0;
var totalLength=null
var pixelsPerStep=null

const timerInterval=40   
const timerSteps=10*1000/timerInterval

var pixelsTraveled=0; // count animation steps
var gTimer; // global timer variable for starting and stopping

//---------
//  called by Interval timer to animate ball moving along path
function animate(){
		//console.log("counter = " + pixelsTraveled)
    if(pixelsTraveled >= myPath.getTotalLength()){   //break as soon as the total length is reached
        clearInterval(gTimer);
        setTimeout(function(){
        	cir.attr({cx: startPath.centerX, cy: startPath.centerY})
        }, 1000)
        return;
    }
    var pos = myPath.getPointAtLength(pixelsTraveled);   //get the position (see Raphael docs)
    cir.attr({cx: pos.x, cy: pos.y});  //set the circle position
    
    pixelsTraveled+=pixelsPerStep; // count the step counter one up
};

//---------
// Triggers animation
myButt=document.getElementById("butt").addEventListener("click", function(){
	if (! myPath) return;
	if (gTimer) clearInterval(gTimer);
	pixelsTraveled=0
	cir.attr({cx: startPath.centerX, cy: startPath.centerY})
	gTimer = setInterval("animate()", timerInterval);
	console.log("play path " + currentPath)
	audioPath[currentPath].play()
})

//----------
let drawPath=function(pNum){
	if (myPath) {
		myPath.remove();
		cir.remove();
	}

	if (pNum==0) return;

	switch(pNum){
		case 0 :
			return;
		case 1:
			myPath=paper.path(cellList2Path([[0,0],[numRows-1,0]]));
			startPath=cellCPos("0/0")
			cir=paper.circle(0,0,10)
			break;
		case 2:
			myPath=paper.path(cellList2Path([[numRows-1,0],[numRows-1,numCols-1]]));
			startPath=cellCPos(`${numRows-1}/0`)
			cir=paper.circle(numRows-1,0,10)
			break;
		case 3:
			myPath=paper.path(cellList2Path([[numRows-1,numCols-1],[0,numCols-1]]));
			startPath=cellCPos(`${numRows-1}/${numCols-1}`)
			cir=paper.circle(numRows-1,numCols-1,10)
			break;
		case 4:
			myPath=paper.path(cellList2Path([[0,numCols-1],[0,0]]));
			startPath=cellCPos(`0/${numCols-1}`)
			cir=paper.circle(0,numCols-1,10)
			break;
		case 5:
			myPath=paper.path(cellList2Path([[0,0],[numRows-1,numCols-1]]));
			startPath=cellCPos(`0/0`)
			cir=paper.circle(0,0,10)
			break;
		case 6:
			myPath=paper.path(cellList2Path([[0,numCols-1],[numRows-1,0]]));
			startPath=cellCPos(`0/${numCols-1}`)
			cir=paper.circle(0,numCols-1,10)
			break;			
	}
	myPath.attr({'stroke-width':2, 'stroke-opacity': 1, 'stroke': '#EEE'})
	cir.attr({cx: startPath.centerX, cy: startPath.centerY, fill:"blue", stroke:"white", 'stroke-width':2})	

	totalLength=myPath.getTotalLength()
	pixelsPerStep=totalLength/timerSteps	
}

document.getElementById("PLAYInstructions").addEventListener("change", function(e){
	currentPath=parseInt(e.target.value)
	console.log(`button press for path ${currentPath}`)
	drawPath(currentPath)

});



//---------
// Regraw Raphael elements when window is resized
window.addEventListener("resize", function(){
	// the grid elements are redrawn because CSS. Here, just redraw the Raphael stuff.
	paper.setSize(container.offsetWidth,container.offsetHeight) 
	drawPath(currentPath)
});