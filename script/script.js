//Const
var LINE_TRESHOLD = 0.12;
var COLUMN_TRESHOLD = 0.0002;
var WHITE_DETECT = 150;
var ZOOM = 2.0;

//Global
var img, ctxInput, ctxGray, ctxBinary, ctxLines, ctxChar, detectionResults;
var detectionResults = {
    "textYCoord": new Array(),
    "breakYCoord": new Array(),
    "charCoord": new Array()
};

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
        
        // Récupération des coordonées des sauts de lignes
        if(isEmpty && !continuousWhite){
            tempCoordWhite = [y, ];
            continuousWhite = true;
        }else if(!isEmpty && continuousWhite){
            tempCoordWhite[1] = y-1;
            continuousWhite = false;
            detectionResults["breakYCoord"].push(tempCoordWhite);
        }
        
        // Récupération des coordonées des lignes de texte
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
        detectChar(detectionResults["textYCoord"]);
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
    appendCanvas("binary", width, height); 
    ctxBinary = document.getElementById('cvs-binary').getContext('2d');
    appendCanvas('lines', width, height);
    ctxLines = document.getElementById('cvs-lines').getContext('2d');
    appendCanvas('char', width, height);
    ctxChar = document.getElementById('cvs-char').getContext('2d');
}

$(document).ready(function(){
    loadInputImg();
    //ocradjs();
});