/*global Phaser*/
/* hexagonal tetris in vertical alignment */

var game = new Phaser.Game(600, 1000, Phaser.AUTO, 'TutContainer', { preload: preload, create: create, update:update});

function BlockData(topB,topRightB,bottomRightB,bottomB,bottomLeftB,topLeftB){
    this.tBlock=topB;
    this.trBlock=topRightB;
    this.brBlock=bottomRightB;
    this.bBlock=bottomB;
    this.blBlock=bottomLeftB;
    this.tlBlock=topLeftB;
    this.mBlock=1;
}

var block1= new BlockData(1,1,0,0,0,1);

var block2= new BlockData(0,1,0,0,0,1);

var block3= new BlockData(1,1,0,0,0,0);

var block4= new BlockData(1,1,0,1,0,0);

var block5= new BlockData(1,0,0,1,0,1);

var block6= new BlockData(0,1,1,0,1,1);

var block7= new BlockData(1,0,0,1,0,0);

var currentBlock= new BlockData(0,0,0,0,0,0);
var prevBlock= new BlockData(0,0,0,0,0,0);

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

var blockMidRowValue;
var blockMidColumnValue;
var needsRender;
var elapsedTime;
var blockPresent;

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
    blockPresent=false;
    releaseBlock();
    needsRender=true;
    elapsedTime=0.0;
}
function update(){
    elapsedTime+=game.time.physicsElapsed;
    if(elapsedTime>1.2){
        elapsedTime=0;
        dropDown();
        needsRender=true;
    }
    if(needsRender){
        //check for collision / bottom
        if(!canMove(1,0)){
            paintBlock(false,true);
            blockPresent=false;
            checkAndCollapseRows();
            releaseBlock();
        }
        renderScene();
    }
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
                if(levelData[i][j]==1){
                    hexSprite.tint='0xff0000';
                }else if(levelData[i][j]>1){
                    hexSprite.tint='0x0000ff';
                }
                gameScene.renderXY(hexSprite,startX, startY, false);
            }
            startX+=horizontalOffset;
        }
        
    }
    needsRender=false;
}
function releaseBlock(){
    if(blockPresent)return;
    blockPresent=true;
    blockMidRowValue=1;
    blockMidColumnValue=5;
    var whichBlock= Math.floor(1+(Math.random()*7));
    //whichBlock=1;
    switch (whichBlock) {//assign blocks
        case 1:
            currentBlock=block1;
            break;
        case 2:
            currentBlock=block2;
            blockMidRowValue=0;
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
            blockMidRowValue=0;
            break;
        case 7:
            currentBlock=block7;
            break;
        default:
           
    }
    console.log(whichBlock);
}
//let us use cubic coordinates to simplify the block painting
function paintBlock(erase, cement){
    if(!blockPresent)return;
    var store=clockWise;
    clockWise=true;
    var val=1;
    if(cement){
        val=2;
    }
    changeLevelData(blockMidRowValue,blockMidColumnValue,val,erase);
    
    var rotatingTile=new Phaser.Point(blockMidRowValue-1,blockMidColumnValue);
    if(currentBlock.tBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.tBlock,erase);
    }
    var midPoint=new Phaser.Point(blockMidRowValue,blockMidColumnValue);
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.trBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.trBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.brBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.brBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.bBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.bBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.blBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.blBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.tlBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.tlBlock,erase);
    }
    clockWise=store;
}
function checkAndCollapseRows(){
    
}
function changeLevelData(iVal,jVal,newValue,erase){
    if(!validIndexes(iVal,jVal))return;
    if(erase){
        levelData[iVal][jVal]=0;
    }else{
        levelData[iVal][jVal]=newValue;
    }
}
function validIndexes(iVal,jVal){
    if(iVal<0 || jVal<0 || iVal>=levelData.length || jVal>=levelData[0].length){
        return false;
    }
    return true;
}
function moveLeft(){
    if(!blockPresent)return;
    if(!canMove(0,-1))return;
    paintBlock(true);
    blockMidColumnValue--;
    needsRender=true;
}
function moveRight(){
    if(!blockPresent)return;
    if(!canMove(0,1))return;
    paintBlock(true);
    blockMidColumnValue++;
    needsRender=true;
}
function dropDown(){
    if(!blockPresent)return;
    if(!canMove(1,0))return;
    paintBlock(true);
    blockMidRowValue++;
    needsRender=true;
}
function validAndEmpty(iVal,jVal){
    if(!validIndexes(iVal,jVal)){
        return false;
    }else if(levelData[iVal][jVal]==2){//occuppied
        return false;
    }
    return true;
}
function canMove(iVal,jVal){
    var validMove=true;
    
    var store=clockWise;
    var newBlockMidPoint=new Phaser.Point(blockMidRowValue+iVal,blockMidColumnValue+jVal);
    clockWise=true;
    if(!validAndEmpty(newBlockMidPoint.x,newBlockMidPoint.y)){//check mid, always 1
        validMove=false;
    }
    
    var rotatingTile=new Phaser.Point(newBlockMidPoint.x-1,newBlockMidPoint.y);
    if(currentBlock.tBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){//check top
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.trBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.brBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.bBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.blBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.tlBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    
    clockWise=store;
    return validMove;
}
function rotateClockWise(){
    if(!blockPresent)return;
    clockWise=true;
    prevBlock=currentBlock;
    rotateBlock();
    if(!canMove(0,0)){
        currentBlock=prevBlock;
        return;
    }else{
        paintBlock(true);
    }
    needsRender=true;
}
function rotateAntiClockWise(){
    if(!blockPresent)return;
    clockWise=false;
    prevBlock=currentBlock;
    rotateBlock();
    if(!canMove(0,0)){
        currentBlock=prevBlock;
        return;
    }else{
        paintBlock(true);
    }
    needsRender=true;
}
function rotateBlock(){
    var midPoint=new Phaser.Point(1,1);
    var newBlockData=
    [
    [0,0,0],
    [0,1,0],
    [0,0,0]
    ];
    var currentBlockData=arrayFromBlock(currentBlock);
    
    var rotatingTile=new Phaser.Point();
    for (var i = 0; i < currentBlockData.length; i++){
            for (var j = 0; j < currentBlockData[0].length; j++)
            {
                if(currentBlockData[i][j]==1){//find every solid tile & rotate
                    rotatingTile.x=i;
                    rotatingTile.y=j;
                    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
                    newBlockData[rotatingTile.x][rotatingTile.y]=1;//populate new blockArray
                }
            }
    }
    currentBlock=blockFromArray(newBlockData);
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
function blockFromArray(arrayToConvert){
    return new BlockData(
        arrayToConvert[0][1],
        arrayToConvert[1][2],
        arrayToConvert[2][2],
        arrayToConvert[2][1],
        arrayToConvert[2][0],
        arrayToConvert[1][0]
    );
}
function arrayFromBlock(blockToConvert){
    var newBlockData=
    [
    [0,0,0],
    [0,1,0],
    [0,0,0]
    ];
    newBlockData[0][1]=blockToConvert.tBlock;
    newBlockData[1][2]=blockToConvert.trBlock;
    newBlockData[2][2]=blockToConvert.brBlock;
    newBlockData[2][1]=blockToConvert.bBlock;
    newBlockData[2][0]=blockToConvert.blBlock;
    newBlockData[1][0]=blockToConvert.tlBlock;
    return newBlockData;
}