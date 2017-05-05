/*global Phaser*/
/* demo cubic coordinates in horizontal alignment */

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
var hexTileHeight=61;
var hexTileWidth=52;
var infoTxt;
var prevTile= new Phaser.Point();
var gameScene;//this is the render texture onto which we draw level
var hexSprite;
var tileTag;

var verticalOffset=hexTileHeight*3/4;
var horizontalOffset=hexTileWidth;
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
    
    hexSprite= game.make.sprite(0, 0, 'hex');
    hexSprite.anchor.setTo(0.5, 0.5);
    tileTag = game.make.text(0,0,'0');
    tileTag.anchor.setTo(0.5, 0.5);
    tileTag.addColor('#ffffff',0);
    tileTag.fontSize=16;
    hexSprite.addChild(tileTag);
    
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
        if(i%2!=0){
            startX=2*startXInit;
        }else{
            startX=startXInit;
        }
        startY=startYInit+(i*verticalOffset);
        for (var j = 0; j < levelData[0].length; j++)
        {
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
                    if(axialPoint.x==6){
                        hexSprite.tint='0xff0000';
                    }
                    if(axialPoint.y==3){
                        hexSprite.tint='0x00ff00';
                    }
                }else{
                    infoTxt.text='cubic';
                    axialPoint=offsetToAxial(axialPoint);
                    cubicZ=calculateCubicZ(axialPoint);
                    tileTag.text = axialPoint.x+"."+axialPoint.y+"."+cubicZ;
                    if(axialPoint.x==6){
                        hexSprite.tint='0xff0000';
                    }
                    if(axialPoint.y==3){
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
    offsetPoint.y=(offsetPoint.y-(Math.floor(offsetPoint.x/2)));//display x = coordinate x' - floor(y/2)
    return offsetPoint;
}
function calculateCubicZ(newAxialPoint){
    return -newAxialPoint.x-newAxialPoint.y;
}
function onHold(){
    tapCount++;
    renderScene();
}
