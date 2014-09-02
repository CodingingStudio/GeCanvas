var isArray = function (value) {
	return value && 
	typeof value === 'object' && 
	typeof value.length === 'number' && 
	typeof value.splice === 'function' && 
	!(value.propertyIsEnumerable('length'));
};

var GeCanvasText = {};

GeCanvasText.DrawCanvas = function ( canvasId, configureData, canvasNum ) {

	if ( isArray(configureData) ) {
		if ( configureData.length >= canvasNum ) 
			configureData = configureData[canvasNum - 1];
		else 
			configureData = configureData[0];
	}

	var theCanvas = initCanvas(document.getElementById(canvasId));

	if ( !theCanvas || !theCanvas.getContext ) {
		return ;
	}

	var colorArray = ["#48C9B0", "#F5D313", "#EC7063", "#58D68D", "#415B76", "#5DADE2"];

	var configure = getDataFromJsonObject(configureData, canvasNum);
	var wordsData = configure.message.split("\n");
	var canvasWidth = configure.canvasWidth;
	var canvasHeight = configure.canvasHeight;

	setCanvasSize(theCanvas, canvasWidth, window.innerHeight, 2);

	var context = theCanvas.getContext("2d");

	var lines = makeTextToLines(wordsData, configure.fontSize);

	if ( isArray (lines) ) {
		var height;
		if ( canvasHeight !== false )
			height = canvasHeight;
		else if ( lines.length > 5 )
			height = lines.length * configure.fontSize / 2 + 4 * configure.fontSize / 2;
		else 
			height = 1.5 * 5 * configure.fontSize / 2;
		setCanvasSize(theCanvas, canvasWidth, height, 2);
	}

	var context = theCanvas.getContext("2d");


	if ( configureData == null ) {

		configureData = {};
		drawNormalText(configureData, lines, canvasNum);

	} else if ( configureData.fontKind === "bubble" ) {
		
		var charArray = [];
		getBubbleFontData (configureData);
		drawBubbleText();

	} else if ( configureData.fontKind === "normal" ) {

		drawNormalText(configureData, lines, canvasNum);

	} else if ( configureData.fontKind === "colorful" ) {

		drawColorfulText(configureData, lines);

	} else {

		drawNormalText(configureData, lines, canvasNum);

	}

	function splitLongLineToShortLines ( line ) {
		
		var metrics = 0;
		var textWidth = 0;
		var newLines = [];

		if ( context.measureText(line).width > 0.9 * theCanvas.width ) {

			for ( var j = line.length ; j > 0 ; j-- ) {

				if ( context.measureText( line.slice(0,j) ).width < 0.9 * theCanvas.width ) {
					
					newLines.push( line.slice(0,j) );

					newLines = newLines.concat( 
									splitLongLineToShortLines(
										line.slice( j, line.length)
									)
								);

					break;
				}
			}

		} else {

			newLines.push(line);

		}

		return newLines;
	}

	function splitLongLines ( lines , fontSize ) {

		context.font = fontSize + "px _sans";
		
		var metrics = 0;
		var textWidth = 0;
		var newLines = [];
		
		for ( var i = 0 ; i < lines.length ; i++ ) {

			metrics = context.measureText(lines[i]);
			textWidth = Math.ceil(metrics.width);
			
			if ( textWidth > 0.9 * theCanvas.width ) {
				
				newLines = newLines.concat( splitLongLineToShortLines ( lines[i], fontSize ) );

			} else {

				newLines.push(lines[i]);

			}
		}

		return newLines;

	}

	function splitLineWithOp ( line , num ) {

		var newLines = [];
		var noOp = true;

		for ( var i = 0 ; i < line.length - 1 ; i++ ) {

			if ( ( line[i] === "," || line[i] === ";" || line[i] === "，" || line[i] === "；" ) ) {
				newLines.push(line.slice(0,i+1));
				var lineBeSlice = line.slice(i+1, line.length);
				newLines = newLines.concat( splitLineWithOp( lineBeSlice , num + 1 ) );
				noOp = false;
				break;
			}
		}

		if ( noOp === true ) {

			newLines.push(line);
		
		}

		return newLines;
	}

	function splitLine ( line, fontSize ) {
		context.font = fontSize + "px _sans";
		var opSplitLines = splitLineWithOp (line, 0);
		var newLines = [];
		newLines = newLines.concat( splitLongLines (opSplitLines, fontSize ) );
		return newLines;
	}

	function makeTextToLines ( wordsData, fontSize ) {
		
		// sometime long sentences must fill the canvas for more area was used to display the words rather than blank.

		// font
		context.font = fontSize + "px _sans";
		
		var lines = [];
		var metrics = 0;
		var textWidth = 0;

		for ( var i = 0 ; i < wordsData.length ; i++ ) {

			metrics = context.measureText(wordsData[i]);
			textWidth = Math.ceil(metrics.width);

			if ( textWidth > 0.9 * theCanvas.width ) {
					lines = lines.concat( 
						splitLine( wordsData[i], fontSize ) );
			} else {
				lines.push(wordsData[i]);
			}
		}
		return lines;
	}

	function drawNormalText ( dataJson, lines, canvasNum ) {
		
		// get the configure data from json object.
		var configure = getDataFromJsonObject(dataJson, canvasNum);
		var wordsData = configure.message.split("\n");
		var fontSize = configure.fontSize;
		var fontColor = configure.fontColor;

		// background
		if ( configure.bgKind === "image" ) {
			
			var imageBacground = new Image();
			imageBacground.src = configure.background;

			imageBacground.onload = function () {
				var pattern = context.createPattern(imageBacground, "repeat");
				context.fillStyle = pattern;
				context.scale(configure.scale, configure.scale);
				context.fillRect(0, 0, theCanvas.width, theCanvas.height);
				context.scale(1/configure.scale, 1/configure.scale);
				
				drawLines(lines, fontSize, fontColor, configure.align);
			}

		} else if ( configure.bgKind === "color" ) {

			context.fillStyle = configure.background;
			context.fillRect(0, 0, theCanvas.width, theCanvas.height);
			drawLines(lines, fontSize, fontColor, configure.align);

		}

	}

	// Colorful Text
	function drawColorfulText ( dataJson, lines ) {

		var configure = getDataFromJsonObject(dataJson);
		var fontSize = configure.fontSize;

		drawColorfulLines(lines, fontSize);
	
	}

	// drawColorfulLine
	function drawColorfulLines ( lines , fontSize , align) {
		
		var gradient = context.createLinearGradient(0, 0, theCanvas.width, 0);

		gradient.addColorStop(0, "#48C9B0");
		gradient.addColorStop(0.2, "#F5D313");
		gradient.addColorStop(0.4, "#EC7063");
		gradient.addColorStop(0.6, "#58D68D");
		gradient.addColorStop(0.8, "#5DADE2");
		gradient.addColorStop(1, "#415B76");

		drawLines(lines, fontSize, gradient, align);

	}


	// Bubble Text
	function getBubbleFontData (dataJson) {

		// 背景
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, 500, 500);

		// 文字
		context.fillStyle = "#000000";
		context.font = "80px _sans";
		context.textBaseline = "top";

		makeTextToBubbleArray(dataJson, dataJson.message, 80);

	}

	function makeTextToBubbleArray (dataJson, message, fontSize) {

		var metrics = context.measureText(message);
		var textWidth = metrics.width;
		var textWidth = Math.ceil(textWidth);
		context.fillText(message, 0, 0);

		var canvasData = context.getImageData(0, 0, textWidth, fontSize * 1.5);

		var idx = 0;

		for ( var i = 0 ; i < fontSize * 1.5 &&
				idx < canvasData.data.length - 4 ; i+=4 ) {
			
			for ( var j = 0 ; j < textWidth &&
					idx < canvasData.data.length - 4 ; j+=4 ) {

				idx = i * (textWidth * 4) + (j * 4);

				// If you want to know the values of the pixel
				var r = canvasData.data[idx + 0];
				var g = canvasData.data[idx + 1];
				var b = canvasData.data[idx + 2];
				var a = canvasData.data[idx + 3];

				if ( ( r < 4 ) || ( g < 4 ) || ( b < 4 ) ) {

					charArray.push({X: j , Y: i, color: colorArray[ (b + i + idx) % (colorArray.length - 1) ]});
				
				}
			}
		}

	}

	function drawBubbleText () {

		context.clearRect(0, 0, theCanvas.width, theCanvas.height);
		context.scale(0.05, 0.05);
		for (var k = 0 ; k < charArray.length ; k+=1 ) {

				context.beginPath();
				
				context.fillStyle = charArray[k].color;

				var x = ( charArray[k].X - 0 ) * 20;
				var y = ( charArray[k].Y - 0 ) * 20;
				
				context.arc( x , y, 40, Math.PI * 2, false);

				context.fill();
				context.closePath();

		}

	}

	function drawLines ( lines, fontSize, fontFill, align) {
		
		var length = lines.length;

		for ( var i = 0 ; i < length ; i++ ) {
			drawOneLine(lines[i], fontSize, length/2 - i - 1 , fontFill, align);
		}
	
	}

	function drawOneLine ( line, fontSize, linesNum, fontFill, align ) {
		// font
		context.fillStyle = fontFill;
		context.font = fontSize + "px _sans";

		var metrics = context.measureText(line);
		var textWidth = Math.ceil(metrics.width);

		var textStartX = 0;
		if ( align === "center") {
			textStartX = theCanvas.width/2 - textWidth/2;
		} else if ( align === "left" ) {
			textStartX = theCanvas.width * 0.1;
		} else if ( align === "right" ) {
			textStartX = theCanvas.width * 0.9 - textWidth;
		}

		context.fillText(line, textStartX, theCanvas.height/2 - fontSize * linesNum);

	}


	function setCanvasSize (theCanvas, width, height, scaleValue) {
		
		theCanvas.style.width = width + "px";
		theCanvas.style.height = height + "px";
		theCanvas.width = width * scaleValue;
		theCanvas.height = height * scaleValue;

	}

	function getDataFromJsonObject ( dataJson, canvasNum ) {

		var colorArray = ["#48C9B0", "#F5D313", "#EC7063", "#58D68D", "#415B76", "#5DADE2"];

		var height = dataJson.canvasHeight;
		if ( height === null || height === undefined )
			height = false;

		var width = dataJson.canvasWidth;
		if ( width === null || width === undefined )
			width = window.innerWidth;

		var fontSize = dataJson.fontSize;
		if ( fontSize === null || fontSize === undefined )
			fontSize = 70;
		
		var font = dataJson.font;
		if ( font === null || font === undefined )
			font = "sans-serif";

		var fontColor = dataJson.fontColor;
		if ( fontColor === null || fontColor === undefined )
			fontColor = "#FFFFFF";
		
		var message = dataJson.message;
		if ( message === null || message === undefined )
			message = "谁念西风独自凉,萧萧黄叶闭疏窗,思往事细思量,被酒莫惊春睡重,赌书消得泼茶香,当时只道是寻常";

		var scale = dataJson.scale;
		if ( scale === null || scale === undefined )
			scale = 1.2;

		var align = dataJson.align;
		if ( align === null || align === undefined )
			align = "right";

		var bgKind = dataJson.bgKind;
		if ( bgKind === null || bgKind === undefined )
			bgKind = "color";

		var background = dataJson.background;
		if ( background === null || background === undefined )
			background = colorArray[ canvasNum % ( colorArray.length - 1 ) ];
		
		return {'fontSize': fontSize, 'font': font, 'message': message, 
				'scale': scale, 'bgKind': bgKind, 'background': background,
				'fontColor': fontColor, 'align': align, 'canvasWidth': width, 'canvasHeight': height};
	}

	function initCanvas (canvas) {
		if (window.G_vmlCanvasManager && window.attachEvent && !window.opera) {
			canvas = window.G_vmlCanvasManager.initElement(canvas);
		}
		return canvas;
	}

}