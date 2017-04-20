//  Here is a custom game object
HexTileNode = function (game, x, y, tileImage,isVertical, i,j, type) {

    Phaser.Sprite.call(this, game, x, y, tileImage);
    this.anchor.setTo(0.5, 0.5);
    this.tileTag = game.make.text(0,0,type);
    //this.tileTag = game.make.text(0,0,'i'+(i)+',j'+(j));
    //this.tileTag = game.make.text(0,0,'i'+(i-6)+',j'+(j-6));
        
    this.tileTag.anchor.setTo(0.5, 0.5);
    this.tileTag.addColor('#ffffff',0);
    if(isVertical){
        this.tileTag.rotation=-Math.PI/2;
    }
    this.addChild(this.tileTag);
    this.revealed=false;
    this.name="tile"+i+"_"+j;
    this.type=type;

    if(isVertical){
        this.rotation=Math.PI/2;
    }
    this.inputEnabled = true;
    
    //offset point directly related to array index
    this.offsetPoint=new Phaser.Point(i,j);
    //we need to do this coordinate conversion ie, offset to axial coordinates which makes everything easier.
    var convertedi=(i-(Math.floor(j/2)));//display x = coordinate x' - floor(y/2)
    this.axialPoint=new Phaser.Point(convertedi,j);
    //the cubic version is easier to find from this as x+y+z=0
    this.cubicZ= -convertedi-j;
    
    this.clearNode();
    this.tileTag.fontSize=16;
    //this.tileTag.visible=true;       
    //this.tileTag.text = this.originali+"."+this.originalj;
    this.toggleCount=0;
};

HexTileNode.prototype = Object.create(Phaser.Sprite.prototype);
HexTileNode.prototype.constructor = HexTileNode;


HexTileNode.prototype.toggleMark=function(){
    if(this.marked){
       this.marked=false; 
       this.tint='0xffffff';
    }else{
        this.marked=true;
        this.tint='0x00cc00';
    }
    return this.marked;
}
HexTileNode.prototype.showDifference=function(){
    //this.getHeuristic(i,j);
    this.tint=Phaser.Color.interpolateColor('0x0000ff','0xffffff',12, this.heuristic,1);//'0xffffff';
    this.tileTag.visible=true;       
    this.tileTag.text = this.heuristic+';'+this.cost;
}

HexTileNode.prototype.toggleCoordinates=function(){
    this.tileTag.visible=true; 
    if(this.toggleCount%2==0){
        this.tileTag.text = this.offsetPoint.x+"."+this.offsetPoint.y;
    }else{
        this.tileTag.text = this.axialPoint.x+"."+this.axialPoint.y+"."+this.cubicZ;
    }
    this.toggleCount++;
}

HexTileNode.prototype.getHeuristic=function(i,j){
    i=(i-(Math.floor(j/2)));
    var di=i-this.axialPoint.x;
    var dj=j-this.axialPoint.y;
    var si=Math.sign(di);
    var sj=Math.sign(dj);
    var absi=di*si;
    var absj=dj*sj;
    if(si!=sj){
        this.heuristic= Math.max(absi,absj);
    }else{
        this.heuristic= (absi+absj);
    }
}

HexTileNode.prototype.markDirty=function(){
    this.tint='0x00ffff';
}

HexTileNode.prototype.clearNode=function(){
    this.tint='0xffffff';
    this.cost=0;
    this.heuristic=0;
    this.nodeVisited=false;
    this.previousNode=null;
    this.nodeClosed=false;
    if(this.type==5){
        this.tint='0x0000ff';
    }
    if(this.type==10){
        this.tint='0xff0000';
    }
    this.tileTag.visible=false;   
}