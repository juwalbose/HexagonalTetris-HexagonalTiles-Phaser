/*global Phaser*/
/* hexagonal A* pathfinding following http://www.policyalmanac.org/games/aStarTutorial.htm */

var game = new Phaser.Game(600, 1000, Phaser.AUTO, 'TutContainer', { preload: preload, create: create});


var block1=
[
[0,1,0],
[1,1,1],
[0,0,0]];
var block2=
[
[0,0,0],
[1,1,1],
[0,0,0]];
var block3=
[
[0,1,0],
[0,1,1],
[0,0,0]];
var block4=
[
[0,1,0],
[0,1,1],
[0,1,0]];
var block5=
[
[0,1,0],
[1,1,0],
[0,1,0]];
var block6=
[
[0,0,0],
[1,1,1],
[1,0,1]];
var block7=
[
[0,1,0],
[0,1,0],
[0,1,0]];

var currentBlock=
[
[0,0,0],
[0,0,0],
[0,0,0]];


var levelData=
[
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0]
];

var bmpText;
var hexTileHeight=52;
var hexTileWidth=61;
var infoTxt;
var gameScene;//this is the render texture onto which we draw level
var hexSprite;
var aKey;
var dKey;
var sKey;
var zKey;
var xKey;
var score;
var clockWise=true;

var verticalOffset=hexTileHeight;
var horizontalOffset=hexTileWidth*3/4;
var startX;
var startY;
var startXInit=hexTileWidth/2;
var startYInit=hexTileHeight/2;
var axialPoint= new Phaser.Point();
var cubicZ;

var blockRowValue;
var blockMidColumnValue;

function preload() {
    //load all necessary assets
    game.load.bitmapFont('font', 'assets/font.png', 'assets/font.xml');
    game.load.image('hex', 'assets/hexsmall.png');
}

function create() {
    bmpText = game.add.bitmapText(10, 10, 'font', 'Tetris\nTap A/D to move block\nTap Z/X to rotate block\nTap S to drop', 18);
    game.stage.backgroundColor = '#cccccc';
    xKey=game.input.keyboard.addKey(Phaser.Keyboard.X);
    xKey.onUp.add(rotateClockWise);
    zKey=game.input.keyboard.addKey(Phaser.Keyboard.Z);
    zKey.onUp.add(rotateAntiClockWise);
    aKey=game.input.keyboard.addKey(Phaser.Keyboard.A);
    aKey.onUp.add(moveLeft);
    dKey=game.input.keyboard.addKey(Phaser.Keyboard.D);
    dKey.onUp.add(moveRight);
    sKey=game.input.keyboard.addKey(Phaser.Keyboard.S);
    sKey.onUp.add(dropDown);
    
    hexSprite= game.make.sprite(0, 0, 'hex');
    hexSprite.anchor.setTo(0.5, 0.5);

    hexSprite.rotation=Math.PI/2;
    
    gameScene=game.add.renderTexture(600,1000);
    game.add.sprite(40, 100, gameScene);
    infoTxt=game.add.text(300,40,'0');
    infoTxt.anchor.setTo(0.5, 0.5);
    
    // Maintain aspect ratio
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    score=0;
    
    releaseBlock();
    renderScene();
}
function renderScene(){
    paintBlock();
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
            axialPoint.x=i;
            axialPoint.y=j;
            hexSprite.tint='0xffffff';
            if(levelData[i][j]>-1){
                axialPoint=offsetToAxial(axialPoint);
                cubicZ=calculateCubicZ(axialPoint);
                if(levelData[i][j]>0){
                    hexSprite.tint='0xff0000';
                }
                gameScene.renderXY(hexSprite,startX, startY, false);
            }
            startX+=horizontalOffset;
        }
        
    }
}
function paintBlock(erase){
    var startI=blockRowValue;
    var startJ=blockMidColumnValue-1;
    var q=0;
    var r=0
    for (var i = startI; i < startI+3; i++){
        for (var j = startJ; j < startJ+3; j++)
        {
            if(blockMidColumnValue%2==0 && j%2!=0){
                if(i-1<0||j<0)continue;
                if(erase){
                    levelData[i-1][j]=0;
                }else{
                    levelData[i-1][j]=currentBlock[q][r];
                } 
            }else{
                if(i<0||j<0)continue;
               if(erase){
                    levelData[i][j]=0;
                }else{
                    levelData[i][j]=currentBlock[q][r];
                } 
            }
            r++
        }
        q++;
        r=0;
    }
}

function releaseBlock(){
    blockRowValue=0;
    blockMidColumnValue=5;
    var whichBlock= Math.floor(1+(Math.random()*7));
    switch (whichBlock) {//assign blocks
        case 1:
            currentBlock=block1;
            break;
        case 2:
            currentBlock=block2;
            //blockRowValue=-1;
            break;
        case 3:
            currentBlock=block3;
            break;
        case 4:
            currentBlock=block4;
            break;
        case 5:
            currentBlock=block5;
            break;
        case 6:
            currentBlock=block6;
            //blockRowValue=-1;
            break;
        case 7:
            currentBlock=block7;
            break;
        default:
           
    }
}
function moveLeft(){
    paintBlock(true);
    blockMidColumnValue--;
    renderScene();
}
function moveRight(){
    paintBlock(true);
    blockMidColumnValue++;
    renderScene();
}
function dropDown(){
    paintBlock(true);
    blockRowValue++;
    renderScene();
}
function rotateClockWise(){
    clockWise=true;
    rotateBlock();
    renderScene();
}
function rotateAntiClockWise(){
    clockWise=false;
    rotateBlock();
    renderScene();
}
function rotateBlock(){
    var numRotations=1;//rotate once
    var midPoint=new Phaser.Point(1,1);
    var newBlockData=
    [
    [0,0,0],
    [0,1,0],
    [0,0,0]
    ];
    
    var rotatingTile=new Phaser.Point();
    for (var i = 0; i < currentBlock.length; i++){
            for (var j = 0; j < currentBlock[0].length; j++)
            {
                if(currentBlock[i][j]==1){//find every solid tile & rotate
                    rotatingTile.x=i;
                    rotatingTile.y=j;
                    for (var k = 0; k < numRotations; k++)
                    {
                        rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
                    }
                    newBlockData[rotatingTile.x][rotatingTile.y]=1;//populate new blockArray
                }
            }
    }
    currentBlock=newBlockData;
}
function rotateTileAroundTile(tileToRotate, anchorTile){
    tileToRotate=offsetToAxial(tileToRotate);//convert to axial
    var tileToRotateZ=calculateCubicZ(tileToRotate);//find z value
    anchorTile=offsetToAxial(anchorTile);//convert to axial
    var anchorTileZ=calculateCubicZ(anchorTile);//find z value
    tileToRotate.x=tileToRotate.x-anchorTile.x;//find x difference
    tileToRotate.y=tileToRotate.y-anchorTile.y;//find y difference
    tileToRotateZ=tileToRotateZ-anchorTileZ;//find z difference
    var pointArr=[tileToRotate.x,tileToRotate.y,tileToRotateZ];//populate array to rotate
    pointArr=arrayRotate(pointArr,clockWise);//rotate array, true for clockwise
    tileToRotate.x=(-1*pointArr[0])+anchorTile.x;//multiply by -1 & remove the x difference
    tileToRotate.y=(-1*pointArr[1])+anchorTile.y;//multiply by -1 & remove the y difference
    tileToRotate=axialToOffset(tileToRotate);//convert to offset
    return tileToRotate;
}
function offsetToAxial(offsetPt){
    offsetPt.x=(offsetPt.x-(Math.floor(offsetPt.y/2)));//display x = coordinate x' - floor(y/2)
    return offsetPt;
}
function axialToOffset(axialPt){
    axialPt.x=(axialPt.x+(Math.floor(axialPt.y/2)));//coordinate x = display x' + floor(y/2)
    return axialPt;
}
function calculateCubicZ(newAxialPoint){
    return -newAxialPoint.x-newAxialPoint.y;
}
function arrayRotate(arr, reverse){//nifty method to rotate array elements
  if(reverse)
    arr.unshift(arr.pop())
  else
    arr.push(arr.shift())
  return arr
} 