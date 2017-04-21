/*global Phaser*/
/* hexagonal A* pathfinding following http://www.policyalmanac.org/games/aStarTutorial.htm */

var game = new Phaser.Game(600, 600, Phaser.AUTO, 'TutContainer', { preload: preload, create: create});


var block1=
[
[-1,1,-1],
[1,1,1],
[0,0,0]];
var block2=
[
[-1,0,-1],
[1,1,1],
[0,0,0]];
var block3=
[
[-1,1,-1],
[0,1,1],
[0,0,0]];
var block4=
[
[-1,1,-1],
[0,1,1],
[0,1,0]];
var block5=
[
[-1,1,-1],
[1,1,0],
[0,1,0]];
var block6=
[
[-1,0,-1],
[1,1,1],
[1,0,1]];


var levelData=
[
[1,1,1,-1,2,2,2,-1,3,3,3],
[1,1,1,-1,2,2,2,-1,3,3,3],
[1,1,1,-1,2,2,2,-1,3,3,3],
[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
[4,4,4,-1,5,5,5,-1,6,6,6],
[4,4,4,-1,5,5,5,-1,6,6,6],
[4,4,4,-1,5,5,5,-1,6,6,6]
];

var bmpText;
var hexTileHeight=52;
var hexTileWidth=61;
//var infoTxt;
var gameScene;//this is the render texture onto which we draw level
var hexSprite;
var tileTag;
var xKey;

var verticalOffset=hexTileHeight;
var horizontalOffset=hexTileWidth*3/4;
var startX;
var startY;
var startXInit=hexTileWidth/2;
var startYInit=hexTileHeight/2;
var axialPoint= new Phaser.Point();
var cubicZ;
var clockWise=true;

function preload() {
    //load all necessary assets
    game.load.bitmapFont('font', 'assets/font.png', 'assets/font.xml');
    game.load.image('hex', 'assets/hexsmall.png');
}

function create() {
    bmpText = game.add.bitmapText(10, 10, 'font', 'Block Rotation\nTap-Hold to rotate\nTap X to change direction', 18);
    game.stage.backgroundColor = '#cccccc';
    xKey=game.input.keyboard.addKey(Phaser.Keyboard.X);
    xKey.onUp.add(toggleRotation);
    
    hexSprite= game.make.sprite(0, 0, 'hex');
    hexSprite.anchor.setTo(0.5, 0.5);
    tileTag = game.make.text(0,0,'0');
    tileTag.anchor.setTo(0.5, 0.5);
    tileTag.addColor('#ffffff',0);
    tileTag.fontSize=16;
    tileTag.rotation=-Math.PI/2;
    hexSprite.addChild(tileTag);
    hexSprite.rotation=Math.PI/2;
    
    gameScene=game.add.renderTexture(550,500);
    game.add.sprite(50, 120, gameScene);
    //infoTxt=game.add.text(15,60,'offset');
    
    game.input.onHold.add(onHold);//hold to clear path
    game.input.holdRate=500;
    // Maintain aspect ratio
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    
    updateLevel();
    renderScene();
}
function toggleRotation(){
    clockWise=!clockWise;
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
            axialPoint.x=i;
            axialPoint.y=j;
            hexSprite.tint='0xffffff';
            this.tileTag.visible=false;  
            if(levelData[i][j]>-1){
                axialPoint=offsetToAxial(axialPoint);
                cubicZ=calculateCubicZ(axialPoint);
                //Just to show the cubic value rotation adound a mid tile
                tileTag.text = (axialPoint.x-1)+"."+(axialPoint.y-1)+"."+(cubicZ+2);//1,1,-2 is middle tile cubic values
                if(levelData[i][j]>0){
                    hexSprite.tint='0xff0000';
                }
                if(i<4&&j<4){
                    this.tileTag.visible=true;  
                }
                gameScene.renderXY(hexSprite,startX, startY, false);
            }
            startX+=horizontalOffset;
        }
        
    }
}
function updateLevel(){//copy new rotated block data of all block to level
    populateLevel(0,0,block1);
    populateLevel(0,4,block2);
    populateLevel(0,8,block3);
    populateLevel(4,0,block4);
    populateLevel(4,4,block5);
    populateLevel(4,8,block6);
}
function populateLevel(startI,startJ,block){
    var q=0;
    var r=0
    for (var i = startI; i < startI+3; i++){
        for (var j = startJ; j < startJ+3; j++)
        {
            levelData[i][j]=block[q][r];
            r++
        }
        q++;
        r=0;
    }
}
function onHold(){//rotate all blocks on hold & redraw
    for (var i = 1; i <7; i++){
        rotateBlock(i);
    }
    updateLevel();
    renderScene();
}
function rotateBlock(whichBlock){
    var blockData=block1;
    switch (whichBlock) {//assign blocks
        case 1:
            blockData=block1;
            break;
        case 2:
            blockData=block2;
            break;
        case 3:
            blockData=block3;
            break;
        case 4:
            blockData=block4;
            break;
        case 5:
            blockData=block5;
            break;
        case 6:
            blockData=block6;
            break;
        default:
           
    }
    var numRotations=1;//rotate once
    var midPoint=new Phaser.Point(1,1);
    var newBlockData=
    [
    [-1,0,-1],
    [0,1,0],
    [0,0,0]
    ];
    
    var rotatingTile=new Phaser.Point();
    for (var i = 0; i < blockData.length; i++){
            for (var j = 0; j < blockData[0].length; j++)
            {
                if(blockData[i][j]==1){//find every solid tile & rotate
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
    switch (whichBlock) {//assign new rotated block data to blocks
        case 1:
            block1=newBlockData;
            break;
        case 2:
            block2=newBlockData;
            break;
        case 3:
            block3=newBlockData;
            break;
        case 4:
            block4=newBlockData;
            break;
        case 5:
            block5=newBlockData;
            break;
        case 6:
            block6=newBlockData;
            break;
        default:
           
    }
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