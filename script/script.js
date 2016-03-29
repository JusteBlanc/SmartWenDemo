//Const
var LINE_TRESHOLD = 0.30;
var WHITE_DETECT = 240;
var zoom = 2.0;

//Global
var img, ctxInput, ctxGray, ctxLines;

function detectLines(){
    var imageData = ctxGray.getImageData(0, 0, img.width * zoom, img.height * zoom);
    var pixels = imageData.data;  
    var nbPixels = pixels.length / 4;
    
    for (var y = 0; y < img.height * zoom; y++)
    {
        var isEmpty = true;
        var percentFilled = 0;
        for(var x = 0; x < img.width * zoom; x++)
        {
            var index = (x + y * img.width * zoom) * 4;
            if( pixels[index] < WHITE_DETECT)
            {
                percentFilled += 1 / img.width * zoom;
                 if(percentFilled > LINE_TRESHOLD)
                 {
                     isEmpty = false;
                 } 
            }
        }
        //Coloration ligne vide
        if(isEmpty)
        {
            for(var x = 0; x < img.width * zoom; x++)
            {
                var index = (x + y * img.width * zoom) * 4;
                pixels[index] = 255; // r
                pixels[index + 1] = 0; // v
                pixels[index + 2] = 0; // b
            }
        }
    }    
    ctxLines.putImageData(imageData, 0, 0);
}

function detectChar(y1,y2){
    
}

function loadInputImg(){
    img = new Image();
    img.src = 'image/imerir.bmp';
    img.onload = function()
    {
        ctxInput.drawImage(img, 0, 0, img.width*zoom, img.height*zoom);
        convertToGray();
        detectLines();
    }
}

function convertToGray()
{
    var imageData = ctxInput.getImageData(0, 0, img.width*zoom, img.height*zoom);
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
}

$(document).ready(function(){
    initialize();
    loadInputImg();
    ocradjs();
});