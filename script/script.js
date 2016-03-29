//Const
var LINE_TRESHOLD = 0.12;
var COLUMN_TRESHOLD = 0.0002;
var WHITE_DETECT = 250;
var BLACK_LIMIT = 160;
var ZOOM = 1.0;

//Global
var img, ctxInput, ctxGray, ctxBinary, ctxLines, ctxChar, linesYCoord;

function detectLines(){
    linesYCoord = new Array();
    var imageData = ctxBinary.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    var continuousText = false;
    var tempCoord = new Array();
    for (var y = 0; y < img.height * ZOOM; y++)
    {
        var isEmpty = true;
        var percentFilled = 0;
        for(var x = 0; x < img.width * ZOOM; x++)
        {
            var index = (x + y * img.width * ZOOM) * 4;
            if( pixels[index] < WHITE_DETECT)
            {
                 percentFilled += 1 / img.width * ZOOM;
                 if(percentFilled > LINE_TRESHOLD)
                 {
                     isEmpty = false;
                 } 
            }
        }
        if(!isEmpty && !continuousText){
            tempCoord = [y , ];
            continuousText = true;
        }
        else if(isEmpty && continuousText)
        {
            tempCoord[1] = y-1;
            continuousText = false;
            linesYCoord.push(tempCoord);
        }
        //Coloration ligne vide
        if(isEmpty)
        {
            for(var x = 0; x < img.width * ZOOM; x++)
            {
                var index = (x + y * img.width * ZOOM) * 4;
                pixels[index] = 255; // r
                pixels[index + 1] = 0; // v
                pixels[index + 2] = 0; // b
            }
        }
    }    
    ctxLines.putImageData(imageData, 0, 0);
    console.log("LinesYCoord: " + linesYCoord);
    return(linesYCoord);
}

function binary(){
    var imageData = ctxGray.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    
    for (var y = 0; y < img.height * ZOOM; y++)
    {
        for(var x = 0; x < img.width * ZOOM; x++)
        {
            var index = (x + y * img.width * ZOOM) * 4;
            if( pixels[index] < BLACK_LIMIT)
            {
                pixels[index] = 0; // r
                pixels[index + 1] = 0; // v
                pixels[index + 2] = 0; // b
            }else{
                pixels[index] = 255; // r
                pixels[index + 1] = 255; // v
                pixels[index + 2] = 255; // b
            }
        }
    }
    ctxBinary.putImageData(imageData, 0, 0);
}

function enlargeWhiteLines(yTabs){
    var imageData = ctxLines.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
}

function detectChar(yTabs){
    var imageData = ctxBinary.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    
    $.each(yTabs, function(yIndex,yTab) {
        for( var x = 0; x < img.width * ZOOM; x++)
        {
            var isEmpty = true;
            var percentFilled = 0;
            for( var y = yTab[0]; y < yTab[1]; y++)
            {
                var index = (x + y * img.width * ZOOM) * 4;
                if( pixels[index] < WHITE_DETECT)
                {
                    percentFilled += 1 / img.width * ZOOM;
                    if(percentFilled > COLUMN_TRESHOLD)
                    {
                        isEmpty = false;
                    } 
                }
            }
            //Coloration ligne vide
            if(isEmpty)
            {
                for(var y = yTab[0]; y < yTab[1]; y++)
                {
                    var index = (x + y * img.width * ZOOM) * 4;
                    pixels[index] = 0; // r
                    pixels[index + 1] = 255; // v
                    pixels[index + 2] = 0; // b
                }
            }
        }
    }, this);
    ctxChar.putImageData(imageData, 0, 0);
}

function loadInputImg(){
    img = new Image();
    img.src = 'image/imerir.jpg';
    img.onload = function()
    {
        initializeCanvas(img.width, img.height);
        
        ctxInput.drawImage(img, 0, 0, img.width * ZOOM, img.height * ZOOM);
        convertToGray();
        binary();
        detectLines();
        detectChar(linesYCoord);
    }
}

function convertToGray()
{
    var imageData = ctxInput.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length/4;
    
    for (var i=0; i<nbPixels; i++) 
    {
        var average = 0.299* pixels[i*4] + 0.587* pixels[i*4+1] + 0.114*pixels[i*4+2];
        //var average = (pixels[i*4] + pixels[i*4+1] + pixels[i*4+2]) /3 ;
        
        pixels[i*4] = average; // r
        pixels[i*4+1] = average; // v
        pixels[i*4+2] = average; // b
        pixels[i*4+3] = 255; // alpha
    }
    
    ctxGray.putImageData(imageData, 0, 0);
}

function ocradjs()
{
    var text = OCRAD(document.getElementById('cvs-input'));
    console.log(text);
}

function appendCanvas(canvasName, width, height)
{
    var cvs = document.createElement("canvas");
    cvs.id = 'cvs-' + canvasName;
    cvs.setAttribute("width",width * ZOOM);
    cvs.setAttribute("height",height * ZOOM);
    document.getElementById('div-' + canvasName).appendChild(cvs);
}

function initializeCanvas(width, height)
{
    appendCanvas("input", width, height);
    ctxInput = document.getElementById('cvs-input').getContext('2d');
    appendCanvas("gray", width, height);        
    ctxGray = document.getElementById('cvs-gray').getContext('2d');
<<<<<<< HEAD
    ctxBinary = document.getElementById('cvs-binary').getContext('2d');
=======
    appendCanvas('lines', width, height);
>>>>>>> c88b2bec17b0e69f5ec9edf990aea032d0bfe4ba
    ctxLines = document.getElementById('cvs-lines').getContext('2d');
    appendCanvas('char', width, height);
    ctxChar = document.getElementById('cvs-char').getContext('2d');
}

$(document).ready(function(){
    loadInputImg();
    //ocradjs();
});