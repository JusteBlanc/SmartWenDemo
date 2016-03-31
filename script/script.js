//Const
var LINE_TRESHOLD = 0.12;
var COLUMN_TRESHOLD = 0.0002;
var WHITE_DETECT = 150;
var ZOOM = 1.0;
var BILINEAR_ZOOM = 2;

//Global
var img, ctxInput, ctxGray, ctxBinary, ctxLines, ctxChar, ctxBilinear, ctxSquareChar, detectionResults;
var detectionResults = {
    "textYCoord": new Array(),
    "breakYCoord": new Array(),
    "charCoord": new Array()
};

function bilinearInterpolationZoom(zoomValue)
{
        
    //Ajout d'un comparatif
    var cvs = document.createElement("canvas");
    cvs.id = 'cvs-canvas-zoom';
    cvs.setAttribute("width",img.width * zoomValue * ZOOM);
    cvs.setAttribute("height",img.height * zoomValue * ZOOM);
    document.getElementById("div-canvas-zoom").appendChild(cvs);
    var ctxComp = cvs.getContext('2d');
    ctxComp.drawImage(img, 0, 0, img.width * zoomValue * ZOOM, img.height * zoomValue * ZOOM);
    
    
    appendCanvas('bilinear', img.width * zoomValue, img.height * zoomValue);
    ctxBilinear = document.getElementById('cvs-bilinear').getContext('2d');
    var srcData = ctxInput.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var srcPixels = srcData.data;
    var resultData = ctxBilinear.getImageData(0, 0, img.width * ZOOM * zoomValue, img.height * ZOOM * zoomValue);
    var resultPixels = resultData.data;
    if(zoomValue > 1)
    {
        // Copie des pixels non modifiés de l'image originale
        for(var y = 0; y < img.height * ZOOM; y++){
            for(var x=0; x < img.width * ZOOM; x++){
                var srcPixelIndex = (x + y * img.width * ZOOM ) * 4;
                var resultPixelIndex = (srcPixelIndex*zoomValue) + (y * zoomValue * 4 * ZOOM * img.width ) * (zoomValue-1);
                
                for (var i =0; i < 4; i++){
                    resultPixels[resultPixelIndex + i] = srcPixels[srcPixelIndex + i];
                }
            }
        }
        // Interpolation horizontale entre les pixels connus
        for(var y = 0; y < img.height * ZOOM -1; y++){
            for(var x=0; x < img.width * ZOOM -1; x++){
                var indexLeft =  (((x + y * img.width * ZOOM ) * 4) * zoomValue) + (y * img.width * 4 * ZOOM * zoomValue )* (zoomValue-1) ;
                var indexRight = indexLeft + zoomValue*4;
                for(var offsetIndexChar = 1; offsetIndexChar< zoomValue; offsetIndexChar++)
                {
                    var indexChar = indexLeft + offsetIndexChar*4;
                    for(var i=0; i<4; i++){
                        resultPixels[indexChar + i] = resultPixels[indexLeft + i] * (zoomValue-offsetIndexChar)/zoomValue + resultPixels[indexRight + i] * offsetIndexChar/zoomValue;
                    }
                }
            }
        }
        //Interpolation verticale des pixels restants
        var lineSize = img.width *zoomValue * ZOOM * 4;
        for(var x=0; x < img.width * zoomValue * ZOOM; x++)
        {
            for(var y = 0; y < img.height * zoomValue * ZOOM; y+=zoomValue){
                var indexTop = x*4 + y*lineSize;
                var indexBot = indexTop + zoomValue * lineSize;
                
                for(var offsetIndexChar = 1; offsetIndexChar< zoomValue; offsetIndexChar++)
                {
                    var indexChar = indexTop + offsetIndexChar * lineSize;
                    for(var i = 0; i<4; i++)
                    {
                        resultPixels[indexChar + i] = resultPixels[indexTop + i] * (zoomValue-offsetIndexChar)/zoomValue + resultPixels[indexBot + i] * offsetIndexChar/zoomValue;
                    }
                }
                
            }
        }
        ctxBilinear.putImageData(resultData, 0, 0);
    }
}


function detectLines(){
    detectionResults["textYCoord"] = new Array();
    var imageData = ctxBinary.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    var continuousText = false;
    var continuousWhite = false;
    var tempCoordText = new Array();
    var tempCoordWhite = new Array();
    for (var y = 0; y < img.height * ZOOM; y++)
    {
        // Detection des lignes "blanches"
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
        
        // Recuperation des coordonees des sauts de lignes
        if(isEmpty && !continuousWhite){
            tempCoordWhite = [y, ];
            continuousWhite = true;
        }else if(!isEmpty && continuousWhite){
            tempCoordWhite[1] = y-1;
            continuousWhite = false;
            detectionResults["breakYCoord"].push(tempCoordWhite);
        }
        
        // Récuperation des coordonees des lignes de texte
        if(!isEmpty && !continuousText){
            tempCoordText = [y , ];
            continuousText = true;
        }
        else if(isEmpty && continuousText)
        {
            tempCoordText[1] = y-1;
            continuousText = false;
            detectionResults["textYCoord"].push(tempCoordText);
        }
        
        //Coloration des sauts de lignes
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
    return(detectionResults["textYCoord"]);
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
            if( pixels[index] < WHITE_DETECT)
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

function detectChar(yTabs){
    var tempCoord = {
        "x":0,
        "y":0,
        "w":0,
        "h":0,
    };
    detectionResults["charCoord"] = new Array();
    var imageData = ctxBinary.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    var continuousChar = false;
    
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
            if(!isEmpty && !continuousChar)
            {
                tempCoord.x = x;
                tempCoord.y = yTab[0];
                continuousChar = true;
            }else if(isEmpty && continuousChar)
            {
                tempCoord.w = x-tempCoord.x;
                tempCoord.h = yTab[1]-yTab[0];
                continuousChar = false;
                detectionResults["charCoord"].push(tempCoord);
                tempCoord = {
                    "x":0,
                    "y":0,
                    "w":0,
                    "h":0,
                };
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
        detectChar(detectionResults["textYCoord"]);
        drawChar();
        bilinearInterpolationZoom(BILINEAR_ZOOM);
    }
}

function drawChar(){
    var imageData = ctxBinary.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    var index;
    var offsetSquare = 1;
    
    $.each(detectionResults["charCoord"], function(charIndex,charCoord) {
        console.log(charCoord);
        
        
        
        for(var x = charCoord.x - offsetSquare; x <= charCoord.x + charCoord.w + offsetSquare; x++)
        {
            index = (x + (charCoord.y - offsetSquare) * img.width * ZOOM) * 4;
            pixels[index] = 255;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
            index = (x + (charCoord.y + charCoord.h + offsetSquare) * img.width * ZOOM) * 4;
            pixels[index] = 255;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
        }
        
        for(var y = charCoord.y - offsetSquare ; y <= charCoord.y + charCoord.h + offsetSquare; y++)
        {
            index = (charCoord.x - offsetSquare + y * img.width * ZOOM) * 4;
            pixels[index] = 255;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
            index = (charCoord.x + offsetSquare + charCoord.w + y * img.width * ZOOM) * 4;
            pixels[index] = 255;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
        }
    }, this);
    ctxSquareChar.putImageData(imageData, 0, 0);
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
    cvs.setAttribute("width", width * ZOOM);
    cvs.setAttribute("height",height * ZOOM);
    document.getElementById('div-' + canvasName).appendChild(cvs);

}

function initializeCanvas(width, height)
{
    appendCanvas("input", width, height);
    ctxInput = document.getElementById('cvs-input').getContext('2d');
    appendCanvas("gray", width, height);        
    ctxGray = document.getElementById('cvs-gray').getContext('2d');
    appendCanvas("binary", width, height); 
    ctxBinary = document.getElementById('cvs-binary').getContext('2d');
    appendCanvas('lines', width, height);
    ctxLines = document.getElementById('cvs-lines').getContext('2d');
    appendCanvas('char', width, height);
    ctxChar = document.getElementById('cvs-char').getContext('2d');
    appendCanvas('squareChar', width, height);
    ctxSquareChar = document.getElementById('cvs-squareChar').getContext('2d');
    
}

$(document).ready(function(){
    loadInputImg();
    //ocradjs();
});