/*global Phaser*/
/* hexagonal A* pathfinding following http://www.policyalmanac.org/games/aStarTutorial.htm */

var game = new Phaser.Game(800, 680, Phaser.AUTO, 'TutContainer', { preload: preload, create: create});

//horizontal tile shaped level
var levelData=
[[-1,-1,-1,0,0,0,0,0,0,0,-1,-1,-1],
[-1,-1,0,0,0,0,0,0,0,0,-1,-1,-1],
[-1,-1,0,0,0,0,0,0,0,0,0,-1,-1],
[-1,0,0,0,0,0,0,0,0,0,0,-1,-1],
[-1,0,0,0,0,0,0,0,0,0,0,0,-1],
[0,0,0,0,0,0,0,0,0,0,0,0,-1],
[0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,-1],
[-1,0,0,0,0,0,0,0,0,0,0,0,-1],
[-1,0,0,0,0,0,0,0,0,0,0,-1,-1],
[-1,-1,0,0,0,0,0,0,0,0,0,-1,-1],
[-1,-1,0,0,0,0,0,0,0,0,-1,-1,-1],
[-1,-1,-1,0,0,0,0,0,0,0,-1,-1,-1]];

var bmpText;
var hexTileHeight=52;
var hexTileWidth=61;
var infoTxt;
var prevTile= new Phaser.Point();
var gameScene;//this is the render texture onto which we draw level
var hexSprite;
var tileTag;

var verticalOffset=hexTileHeight;
var horizontalOffset=hexTileWidth*3/4;
var startX;
var startY;
var startXInit=hexTileWidth/2;
var startYInit=hexTileHeight/2;
var axialPoint= new Phaser.Point();
var cubicZ;
var tapCount=0;

function preload() {
    //load all necessary assets
    game.load.bitmapFont('font', 'assets/font.png', 'assets/font.xml');
    game.load.image('hex', 'assets/hexsmall.png');
}

function create() {
    bmpText = game.add.bitmapText(10, 10, 'font', 'Different Coordinates\nTap Hold to change', 18);
    game.stage.backgroundColor = '#cccccc';
    levelData=transpose(levelData);//transpose for having the right shape
    
    hexSprite= game.make.sprite(0, 0, 'hex');
    hexSprite.anchor.setTo(0.5, 0.5);
    tileTag = game.make.text(0,0,'0');
    tileTag.anchor.setTo(0.5, 0.5);
    tileTag.addColor('#ffffff',0);
    tileTag.fontSize=16;
    tileTag.rotation=-Math.PI/2;
    hexSprite.addChild(tileTag);
    hexSprite.rotation=Math.PI/2;
    
    gameScene=game.add.renderTexture(game.width,game.height);
    game.add.sprite(0, 0, gameScene);
    infoTxt=game.add.text(15,60,'offset');
    
    game.input.onHold.add(onHold);//hold to clear path
    game.input.holdRate=500;
    // Maintain aspect ratio
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    
    //game.input.addMoveCallback(recentreHexGrid, this);//shows heuristics wrt tile under mouse
    //game.input.onTap.add(onTap);//tap to find path
    
    renderScene();
}

function renderScene(){
    gameScene.clear();//clear the previous frame then draw again
    
    for (var i = 0; i < levelData.length; i++)
    {
        startX=startXInit;
        startY=2*startYInit+(i*verticalOffset);
        for (var j = 0; j < levelData[0].length; j++)
        {
            if(j%2!=0){
                startY=startY+startYInit;
            }else{
                startY=startY-startYInit;
            }
            axialPoint.x=i;//i-6;
            axialPoint.y=j;//j-6;
            var coordinateType=tapCount%3;
            hexSprite.tint='0xffffff';
            if(levelData[i][j]!=-1){
                if(coordinateType==0){
                    infoTxt.text='offset';
                    tileTag.text = axialPoint.x+"."+axialPoint.y;
                    if(axialPoint.x==6){
                        hexSprite.tint='0xff0000';
                    }
                    if(axialPoint.y==6){
                        hexSprite.tint='0x00ff00';
                    }
                }else if(coordinateType==1){
                    infoTxt.text='axial';
                    axialPoint=offsetToAxial(axialPoint);
                    tileTag.text = axialPoint.x+"."+axialPoint.y;
                    if(axialPoint.x==3){
                        hexSprite.tint='0xff0000';
                    }
                    if(axialPoint.y==6){
                        hexSprite.tint='0x00ff00';
                    }
                }else{
                    infoTxt.text='cubic';
                    axialPoint=offsetToAxial(axialPoint);
                    cubicZ=calculateCubicZ(axialPoint);
                    tileTag.text = axialPoint.x+"."+axialPoint.y+"."+cubicZ;
                    if(axialPoint.x==3){
                        hexSprite.tint='0xff0000';
                    }
                    if(axialPoint.y==6){
                        hexSprite.tint='0x00ff00';
                    }
                    if(cubicZ==-9){
                        hexSprite.tint='0x0000ff';
                    }
                }
                gameScene.renderXY(hexSprite,startX, startY, false);
                
            }
            startX+=horizontalOffset;
        }
        
    }
}
function offsetToAxial(offsetPoint){
    offsetPoint.x=(offsetPoint.x-(Math.floor(offsetPoint.y/2)));//display x = coordinate x' - floor(y/2)
    return offsetPoint;
}
function calculateCubicZ(newAxialPoint){
    return -newAxialPoint.x-newAxialPoint.y;
}
function onHold(){
    tapCount++;
    renderScene();
}
/*
function onTap(){
    //var tile= findHexTile();
    
}
function recentreHexGrid(){
    var tile= findHexTile();
    if(Phaser.Point.equals(tile,prevTile))return;
    prevTile=tile.clone();
    var hexTile;
    if(!checkforBoundary(tile.x,tile.y)){
        if(!checkForOccuppancy(tile.x,tile.y)){
            for (var i = 0; i < levelData.length; i++)
            for (var j = 0; j < levelData[0].length; j++)
            {
                if(levelData[i][j]!=-1){
                hexTile=hexGrid.getByName("tile"+i+"_"+j);
                hexTile.getHeuristic(tile.x,tile.y);
                hexTile.showDifference();
                }
            }
        }
        
    }
}

function findHexTile(){
    var pos=game.input.activePointer.position;
    pos.x-=hexGrid.x;
    pos.y-=hexGrid.y;
    var xVal = Math.floor((pos.x)/(hexTileWidth*3/4));
    var yVal = Math.floor((pos.y)/(hexTileHeight));
    var dX = (pos.x)%(hexTileWidth*3/4);
    var dY = (pos.y)%(hexTileHeight); 
    var slope = (hexTileHeight/2)/(hexTileWidth/4);
    var caldX=dY/slope;
    var delta=hexTileWidth/4-caldX;
    if(xVal%2==0){
        if(dX>Math.abs(delta)){// even left
            
        }else{//odd right
            if(delta>0){//odd right bottom
                xVal--;
                yVal--;
            }else{//odd right top
                xVal--;
            }
        }
    }else{
        if(delta>0){
            if(dX<caldX){//even right top
                xVal--;
            }else{//odd mid
               yVal--; 
            }
        }else{//current values wont help for even right bottom
           if(dX<((hexTileWidth/2)-caldX)){//even right bottom
              //console.log(dY+':'+dX+':'+((hexTileWidth/2)-caldX));
                xVal--;
           }
        }
        
    }
   
   //infoTxt.text='i'+yVal +'j'+xVal;
   pos.x=yVal;
   pos.y=xVal;
   return pos;
}
function onHold(){
    //rotate
    var hexTile;
    for (var i = 0; i < levelData.length; i++)
    {
        for (var j = 0; j < levelData[0].length; j++)
        {
            if(levelData[i][j]!=-1){
                hexTile=hexGrid.getByName("tile"+i+"_"+j);
                hexTile.toggleCoordinates();
            }
        }
    }
}
function getNeighbors(i,j){
    //first add common elements for odd & even cols
    var tempArray=[];
    var newi=i-1;//t even odd
    var newj=j;
    populateNeighbor(newi,newj,tempArray);
    newi=i+1;
    newj=j;//b even odd
    populateNeighbor(newi,newj,tempArray);
    newi=i;
    newj=j-1;//lt odd lb even
    populateNeighbor(newi,newj,tempArray);
    newi=i;//rt odd rb even
    newj=j+1;
    populateNeighbor(newi,newj,tempArray);
    //now add the different neighbours for odd & even cols
    if(j%2==0){//based on j
        newi=i-1;
        newj=j-1;//lt even
        populateNeighbor(newi,newj,tempArray);
        newj=j+1;//rt even 
        populateNeighbor(newi,newj,tempArray);
    }else{
        newi=i+1;
        newj=j-1;//lb odd
        populateNeighbor(newi,newj,tempArray);
        newj=j+1;//rb odd
        populateNeighbor(newi,newj,tempArray);
    }
    
    return tempArray;
}
function checkForOccuppancy(i,j){//check if the tile is outside effective area or has a mine
    var tileType=levelData[i][j];
    if(tileType==-1 || tileType==10){
        return true;
    }
    return false;
}
function checkforBoundary(i,j){//check if the tile is outside level data array
    if(i<0 || j<0 || i >levelData.length-1 || j>levelData[0].length-1){
        return true;
    }
    return false;
}
function populateNeighbor(i,j, tempArray){//check & add new neighbor
    var newPt=new Phaser.Point();
    if(!checkforBoundary(i,j)){
        if(!checkForOccuppancy(i,j)){
            newPt=new Phaser.Point();
            newPt.x=i;
            newPt.y=j;
            tempArray.push(newPt);
        }
    }
}
*/
function transpose(a) {
    return Object.keys(a[0]).map(
        function (c) { return a.map(function (r) { return r[c]; }); }
        );
}