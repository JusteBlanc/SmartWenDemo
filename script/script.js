//Const
var LINE_TRESHOLD = 0.30;
var COLUMN_TRESHOLD = 0.30;
var WHITE_DETECT = 240;
var ZOOM = 2.0;

//Global
var img, ctxInput, ctxGray, ctxLines, ctxChar, linesYCoord;

function detectLines(){
    linesYCoord = new Array();
    var imageData = ctxGray.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    var continuousWhite = false;
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
        if(isEmpty && !continuousWhite){
            tempCoord = [y , ];
            continuousWhite = true;
        }
        else if(!isEmpty && continuousWhite)
        {
            tempCoord[1] = y-1;
            continuousWhite = false;
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
    return(linesYCoord);
}



function detectChar(yTabs){
    var imageData = ctxGray.getImageData(0, 0, img.width * ZOOM, img.height * ZOOM);
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
    img.src = 'image/imerir.bmp';
    img.onload = function()
    {
        ctxInput.drawImage(img, 0, 0, img.width * ZOOM, img.height * ZOOM);
        convertToGray();
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

function initialize()
{
    ctxInput = document.getElementById('cvs-input').getContext('2d');
    ctxGray = document.getElementById('cvs-gray').getContext('2d');
    ctxLines = document.getElementById('cvs-lines').getContext('2d');
    ctxChar = document.getElementById('cvs-char').getContext('2d');
}

$(document).ready(function(){
    initialize();
    loadInputImg();
    ocradjs();
});