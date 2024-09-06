import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker ikke klasser, kun funksjoner.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	let rememberCamera = true;
	let cameraPosition = {x:0,y:50,z:500}
	if(rememberCamera){
		if(typeof localStorage["eye"] === "undefined"){
			saveCamera(cameraPosition);
		}
		cameraPosition = JSON.parse(localStorage.eye);
	}
	let windmillAngel = 0;
	setInterval(() => {
		windmillAngel+=document.getElementById("wind").value*Math.PI*2/180;
		draw(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
	},50)
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 1920, 1080);
	const gl = webGLCanvas.gl;
	let baseShaderInfo = initBaseShaders(gl);
	let renderInfo = {
		gl: webGLCanvas.gl,
		baseShaderInfo: initBaseShaders(webGLCanvas.gl),
		coordsBuffers: initCoordsBuffers(webGLCanvas.gl),
		grassBuffers: initGrassBuffers(webGLCanvas.gl),
		roadBuffers: initRoadBuffers(webGLCanvas.gl),
		cubeBuffers: initCube(webGLCanvas.gl),
		coneBuffers: initCone(webGLCanvas.gl),
		propellerBuffers: initPropellerBuffers(webGLCanvas.gl),
		cylinderBuffers: initCylinderBuffers(webGLCanvas.gl),
		triangleRoofBuffers: initTriangleRoofBuffers(webGLCanvas.gl),
		pyramidRoofBuffers: initPyramidRoofBuffers(webGLCanvas.gl),
		rectangleBuffers: initRectangle(webGLCanvas.gl, 10, 100),
	};

	draw(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
	initEvents(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
}

function initEvents(gl, baseShaderInfo, renderInfo, cameraPosition){
	document.onwheel = (e) => {
		if(e.deltaY > 0 ){
			cameraPosition.x = cameraPosition.x * 0.9
			cameraPosition.y = cameraPosition.y * 0.9
			cameraPosition.z = cameraPosition.z * 0.9
		}
		if(e.deltaY < 0 ){
			cameraPosition.x = cameraPosition.x * 1.1
			cameraPosition.y = cameraPosition.y * 1.1
			cameraPosition.z = cameraPosition.z * 1.1
		}
		// draw(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
	}
	document.onkeydown = (e) => {
		if(e.code === "ArrowLeft"){
			let radius = (cameraPosition.x**2 + cameraPosition.z**2)**(1/2)
			let angle = Math.atan2(cameraPosition.z, cameraPosition.x);
			cameraPosition.x = Math.cos(angle - Math.PI/12) * radius
			cameraPosition.z = Math.sin(angle - Math.PI/12) * radius
		}
		if(e.code === "ArrowRight"){
			let radius = (cameraPosition.x**2 + cameraPosition.z**2)**(1/2)
			let angle = Math.atan2(cameraPosition.z, cameraPosition.x);
			cameraPosition.x = Math.cos(angle + Math.PI/12) * radius
			cameraPosition.z = Math.sin(angle + Math.PI/12) * radius
		}
		if(e.code === "ArrowUp"){
			cameraPosition.y *= 1.1
		}
		if(e.code === "ArrowDown"){
			cameraPosition.y *= 0.9
		}
		saveCamera(cameraPosition)
		// draw(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
	}
}

function saveCamera(cameraPosition) {
	localStorage.eye = JSON.stringify(cameraPosition)
}

function initBaseShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('base-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('base-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}

function initCamera(gl, eye = {x:0,y:0,z:0}, remember) {
	let eyeX = eye.x, eyeY = eye.y, eyeZ = eye.z;
	if (remember){
		eye = JSON.parse(localStorage.eye)
		eyeX = eye.x
		eyeY = eye.y
		eyeZ = eye.z;
	}
	let lookX = 0, lookY = 0, lookZ = 0;
	/*
	if (remember){
		let look = JSON.parse(localStorage.look)
		lookX = look.x
		lookY = look.y
		lookZ = look.z;
	}
	 */
	let upX = 0.0, upY = 1, upZ = 0;
	/*
	if (remember){
		let up = JSON.parse(localStorage.up)
		upX = up.x
		upY = up.y
		upZ = up.z;
	}
	 */

	let viewMatrix = new Matrix4();
	let projectionMatrix = new Matrix4();

	viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);

	const fieldOfView = 10;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const near = 0.1;
	const far = 3000.0;
	projectionMatrix.setPerspective(fieldOfView, aspect, near, far);

	return {
		viewMatrix: viewMatrix,
		projectionMatrix: projectionMatrix
	};
}

function initRectangle(gl, width, length) {
	const halfWidth = width / 2;
	const halfLength = length / 2;
	const positions = new Float32Array([
		-halfWidth, halfLength, 0.0,  // Top-left
		halfWidth, halfLength, 0.0,  // Top-right
		-halfWidth, -halfLength, 0.0, // Bottom-left
		halfWidth, -halfLength, 0.0  // Bottom-right
	]);

	const colors = new Float32Array([
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0   // Gray color
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: 4
	};
}


function initTriangleRoofBuffers(gl, color = {red: 1.0, green: 0.5, blue: 0, alpha: 1.0}) {
	const positions = new Float32Array([
		1, -1, -1,    // X Y Z
		0, 1, -1,    // X Y Z
		1, -1, 1,    // X Y Z
		0, 1, 1,    // X Y Z
		-1, -1, 1,    // X Y Z
		0, 1, -1,    // X Y Z
		-1, -1, -1,    // X Y Z
		1, -1, -1,    // X Y Z
		-1, -1, 1,    // X Y Z
		1, -1, 1,    // X Y Z
		0, 1, 1,    // X Y Z

		-1, -1, -1,    // X Y Z
		-1, -1, 1,    // X Y Z
		1, -1, -1,    // X Y Z
		1, -1, 1,    // X Y Z
	]);

	let colors = [];
	//Samme farge på alle sider:
	for (let i = 0; i < 15; i++) {
		colors.push(color.red, color.green, color.blue, color.alpha);
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3,
	};
}

function initPyramidRoofBuffers(gl, color = {red: 1.0, green: 0.5, blue: 0, alpha: 1.0}) {
	const positions = new Float32Array([
		0, 1, 0,    // X Y Z
		-1, -1, -1,    // X Y Z
		-1, -1, 1,    // X Y Z
		1, -1, 1,    // X Y Z
		1, -1, -1,    // X Y Z
		-1, -1, -1,    // X Y Z

		-1, -1, -1,    // X Y Z
		-1, -1, 1,    // X Y Z
		1, -1, -1,    // X Y Z
		1, -1, 1,    // X Y Z
	]);

	let colors = [];
	//Samme farge på alle sider:
	for (let i = 0; i < 10; i++) {
		colors.push(color.red, color.green, color.blue, color.alpha);
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3,
	};
}

function initCone(gl) {
	let positions = [];
	let colors = [];

	let sectors = 12;
	let stepGrader = 360 / sectors;
	let step = (Math.PI / 180) * stepGrader;
	let r =0 , g = 0, b = 1, a = 1; // Fargeverdier.

	// Startpunkt (toppen av kjegla):
	let x = 0, y = 2, z = 0;
	positions = positions.concat(x, y, z);
	colors = colors.concat(r, g, b, a);

	let phi = 0.0;
	for (let sector = 1; sector <= sectors + 1; sector++) {
		x = Math.cos(phi);
		y = 0;
		z = Math.sin(phi);

		positions = positions.concat(x, y, z);
		g += 0.1; // Endrer litt på fargen for hver verteks.
		colors = colors.concat(r, g, b, a);

		phi += step;
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3,
	};
}

function initCube(gl, color = {red: 1.0, green: 0.5, blue: 0, alpha: 1.0}) {
	let positions = [
		//Forsiden (pos):
		-1, 1, 1,
		-1,-1, 1,
		1,-1, 1,

		-1,1,1,
		1, -1, 1,
		1,1,1,

		//H�yre side:

		1,1,1,
		1,-1,1,
		1,-1,-1,

		1,1,1,
		1,-1,-1,
		1,1,-1,

		//Baksiden (pos):
		1,-1,-1,
		-1,-1,-1,
		1, 1,-1,

		-1,-1,-1,
		-1,1,-1,
		1,1,-1,

		//Venstre side:
		-1,-1,-1,
		-1,1,1,
		-1,1,-1,

		-1,-1,1,
		-1,1,1,
		-1,-1,-1,

		//Topp:
		-1,1,1,
		1,1,1,
		-1,1,-1,

		-1,1,-1,
		1,1,1,
		1,1,-1,

		//Bunn:
		-1,-1,-1,
		1,-1,1,
		-1,-1,1,

		-1,-1,-1,
		1,-1,-1,
		1,-1,1,
	];

	let colors = [];
	//Samme farge på alle sider:
	for (let i = 0; i < 36; i++) {
		colors.push(color.red, color.green, color.blue, color.alpha);
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3,
	};
}

function initPropellerBuffers(gl) {
	// Define positions for the floor (two triangles forming a rectangle)
	const positions = new Float32Array([
		// propeller 1
		25, -1, 0,  // Top left
		-1, -1, 0,   // Top right
		25, 1, 0,    // bottom left
		-1, 1, 0,   // Bottom right
		// propeller 2
		-1, -1,0,  // Top left
		0.5, 0.5, 0,   // Top right
		-13, 21, 0,    // bottom left
		-12, 22, 0,    // Bottom right
		// propeller 3
		-13, -21, 0,  // Top left
		-12, -22, 0,  // Top right
		-1, -1, 0,   // Bottom left
		1, -1, 0,  // Bottom right
	]);

	// Define colors for the floor vertices
	const colors = new Float32Array([
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,   // Gray color

		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,   // Gray color

		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,  // Gray color
		0.8, 0.8, 0.8, 1.0,   // Gray color
	]);


	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3  // 4 vertices
	};
}

function initCylinderBuffers(gl) {
	let sectors = 12;
	let stepGrader = 360.0 / sectors;
	if (stepGrader <= 2)
		stepGrader = 3;
	let step = (Math.PI / 180) * stepGrader;
	let r = 0.7, g = 0.7, b = 0.7, a = 1;
	let positionsArray = [];
	let colorsArray = [];

	let height = 2.0; // Høyden på sylinderen
	let radius = 1.0; // Radius på sylinderen

	// Generer toppsirkelen
	let x = 0, y = height / 2, z = 0; // Topp midtpunkt
	positionsArray = positionsArray.concat(x, y, z);
	colorsArray = colorsArray.concat(r, g, b, a);

	let phi = 0.0;
	for (let sector = 1; sector <= sectors + 2; sector++) {
		x = radius * Math.cos(phi);
		y = height / 2;
		z = radius * Math.sin(phi);

		positionsArray = positionsArray.concat(x, y, z);
		colorsArray = colorsArray.concat(r, g, b, a);

		phi += step;
	}

	// Generer bunnsirkelen
	x = 0, y = -height / 2, z = 0; // Bunn midtpunkt
	positionsArray = positionsArray.concat(x, y, z);
	colorsArray = colorsArray.concat(r, g, b, a);

	phi = 0.0;
	for (let sector = 1; sector <= sectors + 2; sector++) {
		x = radius * Math.cos(phi);
		y = -height / 2;
		z = radius * Math.sin(phi);

		positionsArray = positionsArray.concat(x, y, z);
		colorsArray = colorsArray.concat(r, g, b, a);

		phi += step;
	}

	// Generer sideflatene
	phi = 0.0;
	for (let sector = 1; sector <= sectors + 1; sector++) {
		let x1 = radius * Math.cos(phi);
		let z1 = radius * Math.sin(phi);
		let x2 = radius * Math.cos(phi + step);
		let z2 = radius * Math.sin(phi + step);

		// Første trekant i rektanglet
		positionsArray = positionsArray.concat(x1, -height / 2, z1);
		colorsArray = colorsArray.concat(r, g, b, a);

		positionsArray = positionsArray.concat(x2, -height / 2, z2);
		colorsArray = colorsArray.concat(r, g, b, a);

		positionsArray = positionsArray.concat(x1, height / 2, z1);
		colorsArray = colorsArray.concat(r, g, b, a);

		// Andre trekant i rektanglet
		positionsArray = positionsArray.concat(x1, height / 2, z1);
		colorsArray = colorsArray.concat(r, g, b, a);

		positionsArray = positionsArray.concat(x2, -height / 2, z2);
		colorsArray = colorsArray.concat(r, g, b, a);

		positionsArray = positionsArray.concat(x2, height / 2, z2);
		colorsArray = colorsArray.concat(r, g, b, a);

		phi += step;
	}

	let positions = new Float32Array(positionsArray);
	let colors = new Float32Array(colorsArray);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3,
	};
}

function initRoadBuffers(gl) {
	// Define positions for the floor (two triangles forming a rectangle)
	const positions = new Float32Array([
		// Road 1
		-55, 1, -5,  // Top left
		55, 1, -5,   // Top right
		-55, 1, 5,    // bottom left
		55, 1, 5,    // Bottom right
		// Road 2
		-5, 1, -55,  // Top left
		5, 1, -55,   // Top right
		-5, 1, 55,    // bottom left
		5, 1, 55,    // Bottom right
	]);

	// Define colors for the floor vertices
	const colors = new Float32Array([
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,   // Gray color
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,  // Gray color
		0.4, 0.4, 0.4, 1.0,   // Gray color
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3  // 4 vertices
	};
}

function initGrassBuffers(gl) {
	const extent =  700;

	// Positions for 6 points (each pair forms a line)
	const positions = new Float32Array([
		extent, -0.19, extent,
		-extent, -0.19, extent,
		extent, -0.19, -extent,
		-extent, -0.19, -extent,
	]);

	// Colors corresponding to each point
	const colors = new Float32Array([
		0, 1, 0, 1,  // Green
		0, 1, 0, 1,  // Green
		0, 1, 0, 1,  // Green
		0, 1, 0, 1,  // Green
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3  // 6 vertices, so vertexCount is 6
	};
}

function initCoordsBuffers(gl) {
	const extent =  700;

	// Positions for 6 points (each pair forms a line)
	const positions = new Float32Array([
		// X-axis (Red)
		-extent, 0, 0,
		extent, 0, 0,

		// Y-axis (Green)
		0, -extent, 0,
		0, extent, 0,

		// Z-axis (Blue)
		0, 0, -extent,
		0, 0, extent
	]);

	// Colors corresponding to each point
	const colors = new Float32Array([
		1, 0, 0, 1,  // Red
		1, 0, 0, 1,  // Red
		0, 0, 0, 1,  // Black
		0, 0, 0, 1,  // Black
		0, 0, 1, 1,  // Blue
		0, 0, 1, 1   // Blue
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3  // 6 vertices, so vertexCount is 6
	};
}

function connectPositionAttribute(gl, baseShaderInfo, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexPosition);
}

function connectColorAttribute(gl, baseShaderInfo, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexColor);
}

function initLatticeBuffers(gl, start = {x:0,z:0}, end = {x:3,z:0}, color = {red: 1.0, green: 0.5, blue: 0, alpha: 1.0}) {

	let vertexes = []

	vertexes[0] = start.x;
	vertexes[1] = 3;
	vertexes[2] = start.z;
	vertexes[3] = end.x;
	vertexes[4] = 3;
	vertexes[5] = end.z;
	vertexes[6] = start.x;
	vertexes[7] = 0;
	vertexes[8] = start.z;
	vertexes[9] = end.x;
	vertexes[10] = 0;
	vertexes[11] = end.z;

	for(let i = 0; i < 4; i++){
		vertexes[12+i*6] = start.x + (end.x-start.x)/3*i;
		vertexes[12+i*6+1] = 0;
		vertexes[12+i*6+2] = start.z + (end.z-start.z)/3*i;
		vertexes[12+i*6+3] = start.x + (end.x-start.x)/3*i;
		vertexes[12+i*6+4] = 3;
		vertexes[12+i*6+5] = start.z + (end.z-start.z)/3*i;
	}

	const positions = new Float32Array(vertexes);
	let colors = [];
	//Samme farge på alle sider:
	for (let i = 0; i < positions.length/3; i++) {
		colors.push(color.red, color.green, color.blue, color.alpha);
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3,
	};
}

function clearCanvas(gl) {
	gl.clearColor(0, 0.8, 1, 0.2);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function draw(gl, baseShaderInfo, buffers, cameraPosition, angle) {
	clearCanvas(gl);
	let modelMatrix = new Matrix4();

	//	// road
	modelMatrix.setIdentity();
	drawRoad(buffers, modelMatrix, cameraPosition);

	// draw windmil propeller
	drawPropellers(buffers, modelMatrix, cameraPosition, angle);

	// Hus 1 cone
	drawHouseOne(buffers, modelMatrix, cameraPosition);

	// house 2
	drawHouseTwo(buffers, modelMatrix, cameraPosition);

	// house 3
	drawHouseThree(buffers, modelMatrix, cameraPosition);

	// house 4
	drawHouseFour(buffers, modelMatrix, cameraPosition);

	// drawing Ground
	drawGround(buffers, modelMatrix, cameraPosition);

	// drawing coord
	//drawCoord(buffers, modelMatrix, cameraPosition);


}

function drawCoord(renderInfo, modelMatrix, cameraPosition) {

	// drawing Lines
	modelMatrix.setIdentity();
	drawLine(renderInfo, modelMatrix, cameraPosition);
}

function drawGround(renderInfo, modelMatrix, cameraPosition) {

	// drawing grass
	modelMatrix.setIdentity();
	drawGrass(renderInfo, modelMatrix, cameraPosition);
}
// container house
function drawHouseFour(renderInfo, modelMatrix, cameraPosition) {
	// house 4 første etasje 1
	modelMatrix.setIdentity();
	modelMatrix.translate(-10,0, 70);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.46, green: 0.14, blue: 0.082, alpha: 1.0});
	// house 4 første etasje 2
	modelMatrix.setIdentity();
	modelMatrix.translate(1,0, 70);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.46, green: 0.14, blue: 0.082, alpha: 1.0});
	// house 4 andre etasje
	modelMatrix.setIdentity();
	modelMatrix.translate(-4.5,7, 70);
	modelMatrix.scale(10,2,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.6, green: 0.55, blue: 0.48, alpha: 1.0});
	//Doors for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(1,1, 72.8);
	modelMatrix.scale(0.1,0.05,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	//Doors for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(-10,1, 72.8);
	modelMatrix.scale(0.1,0.05,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 1 for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(-12,7, 72.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 2 for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(-9,7, 72.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 3 for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(3,7, 72.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 4 for house 4
	modelMatrix.setIdentity();
	modelMatrix.translate(0,7, 72.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);

	drawFence(renderInfo, modelMatrix, cameraPosition,{x:-7,y:0,z:70}, 1)

}
// Blue triangle roof
function drawHouseThree(renderInfo, modelMatrix, cameraPosition) {
	// house 3 første etasje
	modelMatrix.setIdentity();
	modelMatrix.translate(-60,0, -15);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.22, green: 0.24, blue: 0.3, alpha: 1.0});
	// house 3 andre etasje
	modelMatrix.setIdentity();
	modelMatrix.translate(-60,6, -15);
	modelMatrix.scale(6,2,6);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.56, green: 0.45, blue: 0.4, alpha: 1.0});
	// house 3  roof
	modelMatrix.setIdentity();
	modelMatrix.translate(-60,10, -15);
	modelMatrix.scale(6,2,6);
	drawPyramidRoof(renderInfo, modelMatrix, cameraPosition,{red: 1.0, green: 1, blue: 1, alpha: 1.0});
	//Doors for house 3
	modelMatrix.setIdentity();
	modelMatrix.translate(-60,0, -12);
	modelMatrix.scale(0.1,0.05,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 1 for house 3
	modelMatrix.setIdentity();
	modelMatrix.translate(-57,6, -8.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 2  for house 3
	modelMatrix.setIdentity();
	modelMatrix.translate(-65,6, -8.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 3  for house 3
	modelMatrix.setIdentity();
	modelMatrix.translate(-63,6, -8.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 4  for house 3
	modelMatrix.setIdentity();
	modelMatrix.translate(-59,6, -8.8);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);

	drawFence(renderInfo, modelMatrix, cameraPosition,{x:21,y:0,z:-60}, 6)
}
// Blue cone + windmill
function drawHouseTwo(renderInfo, modelMatrix, cameraPosition) {

	// house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(20,0, -60);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});
	// house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(25,0, -60);
	modelMatrix.scale(2.5,2.5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.95, green: 0.85, blue: 0.2, alpha: 1.0});
	// house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(15,0, -60);
	modelMatrix.scale(2.5,3,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.55, green: 0.85, blue: 0.45, alpha: 1.0});
	// house 2 roof
	modelMatrix.setIdentity();
	modelMatrix.translate(20,7, -60);
	modelMatrix.scale(5,2,3);
	drawTriangleRoof(renderInfo, modelMatrix, cameraPosition, {red: 0.3, green: 0.58, blue: 0.85, alpha: 1.0});
	//Doors for house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(20,0, -57.4);
	modelMatrix.scale(0.1,0.05,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 1 for house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(14,1.8, -57.3);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 2  for house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(16,1.8, -57.3);
	modelMatrix.scale(0.1,0.015,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// garage door for house 2
	modelMatrix.setIdentity();
	modelMatrix.translate(24.9,0, -57.2);
	modelMatrix.scale(0.3,0.04,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);

	drawFence(renderInfo, modelMatrix, cameraPosition,{x:73,y:0,z:15}, 7)
}
// white Pyramide roof
function drawHouseOne(renderInfo, modelMatrix, cameraPosition) {

	// Hus 1 cone
	modelMatrix.setIdentity();
	modelMatrix.translate(75,5, 25);
	modelMatrix.scale(5,5,5);
	drawCone(renderInfo, modelMatrix, cameraPosition);
	// Hus 1
	modelMatrix.setIdentity();
	modelMatrix.translate(75,0, 25);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});
	// Hus 1
	modelMatrix.setIdentity();
	modelMatrix.translate(70,0, 25);
	modelMatrix.scale(2.5,2.5,2.5);
	drawCube(renderInfo, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});
	//Doors for house 1
	modelMatrix.setIdentity();
	modelMatrix.translate(75,0, 27.7);
	modelMatrix.scale(0.1,0.05,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 1 for house 1
	modelMatrix.setIdentity();
	modelMatrix.translate(72.5,1.6, 27.71);
	modelMatrix.scale(0.1,0.01,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);
	// window 2 for house 1
	modelMatrix.setIdentity();
	modelMatrix.translate(70,1.6, 27.71);
	modelMatrix.scale(0.1,0.01,1);
	drawRectangle(renderInfo, modelMatrix, cameraPosition);

	drawFence(renderInfo, modelMatrix, cameraPosition,{x:-60,y:0,z:-22}, 4)
}

function drawPropellers(renderInfo, modelMatrix, cameraPosition,angle) {

	// draw windmil propeller
	modelMatrix.setIdentity();
	modelMatrix.translate(85,25, 10);
	modelMatrix.rotate(angle,0,0,1);
	modelMatrix.scale(0.8, 0.8 ,0)
	drawPropeller(renderInfo, modelMatrix, cameraPosition);
	// draw windmil cylinder top
	modelMatrix.setIdentity();
	modelMatrix.translate(85,25, 8.9);
	modelMatrix.rotate(90,1,0,0);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);
	// draw windmil cylinder stand
	modelMatrix.setIdentity();
	modelMatrix.translate(85,11, 7.5);
	modelMatrix.rotate(0,1,0,0);
	modelMatrix.scale(1,15,1);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

}

function drawFence(renderInfo, modelMatrix, cameraPosition,globalTranslate = {x:0,y:0,z:0}, gate = 0) {

	modelMatrix.setIdentity();
	modelMatrix.translate(-15 + globalTranslate.x,0 + globalTranslate.y, -15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	if(gate != 0) {
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x, 0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0, 0, 1, 0);
		modelMatrix.scale(1, 1, 1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x: -15, z: -15}, {x: 0, z: -15})
	}

	if(gate != 1){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:0, z:-15}, {x:15,z:-15})
	}

	// draw windmil cylinder stand
	modelMatrix.setIdentity();
	modelMatrix.translate(15 + globalTranslate.x,0 + globalTranslate.y, -15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	if(gate != 2){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:15, z:-15}, {x:15,z:0})
	}

	if(gate != 3){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:15, z:0}, {x:15,z:15})
	}

	modelMatrix.setIdentity();
	modelMatrix.translate(15 + globalTranslate.x,0 + globalTranslate.y, 15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	if(gate != 4){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:15, z:15}, {x:0,z:15})
	}
	if(gate != 5){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:0, z:15}, {x:-15,z:15})
	}

	modelMatrix.setIdentity();
	modelMatrix.translate(-15 + globalTranslate.x,0 + globalTranslate.y, 15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	if(gate != 6){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:-15, z:15}, {x:-15,z:0})
	}
	if(gate != 7){
		modelMatrix.setIdentity();
		modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
		modelMatrix.rotate(0,0,1,0);
		modelMatrix.scale(1,1,1);
		drawLattice(renderInfo, modelMatrix, cameraPosition, {x:-15, z:0}, {x:-15,z:-15})
	}

	modelMatrix.setIdentity();
	modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, -15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(-15 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(15 + globalTranslate.x,0 + globalTranslate.y, 0 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(0 + globalTranslate.x,0 + globalTranslate.y, 15 + globalTranslate.z);
	modelMatrix.rotate(0,0,1,0);
	modelMatrix.scale(0.3,3,0.3);
	drawCylinder(renderInfo, modelMatrix, cameraPosition)

}

function drawLattice(renderInfo, modelMatrix, cameraPosition, start, end, colors = {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0}) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	let latticeBuffers = initLatticeBuffers(renderInfo.gl, start, end, colors);

	// Draw the windmill propellers
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, latticeBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, latticeBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.LINE_STRIP, 0, 2);
	renderInfo.gl.drawArrays(renderInfo.gl.LINE_STRIP, 2, 2);
	renderInfo.gl.drawArrays(renderInfo.gl.LINE_STRIP, 4, 8);

}

function drawTriangleRoof(renderInfo, modelMatrix, cameraPosition, colors) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the windmill propellers
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.triangleRoofBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, initTriangleRoofBuffers(renderInfo.gl, colors).color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, 11);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 11, 4);

}

function drawPyramidRoof(renderInfo, modelMatrix, cameraPosition, colors) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the windmill propellers
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.pyramidRoofBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, initPyramidRoofBuffers(renderInfo.gl, colors).color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_FAN, 0, 6);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 6, 4);

}

function drawPropeller(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the windmill propellers
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.propellerBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.propellerBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, 4);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 4, 4);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 8, 4);

}

function drawCylinder(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw sylinder for windmill
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.cylinderBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.cylinderBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, renderInfo.cylinderBuffers.vertexCount);  // Tegner sylinderen

}

function drawRoad(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the road
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.roadBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.roadBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, 4);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 4, 4);

}

function drawCone(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the Cone
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coneBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coneBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_FAN, 0, renderInfo.coneBuffers.vertexCount);

}

function drawCube(renderInfo, modelMatrix, cameraPosition, color) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the House
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.cubeBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo,initCube(renderInfo.gl, color ).color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.cubeBuffers.vertexCount);


}

function drawRectangle(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the Cone
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.rectangleBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.rectangleBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, renderInfo.rectangleBuffers.vertexCount);

}

function drawGrass(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);


	// Draw the grass/ground

	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.grassBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.grassBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, 0, renderInfo.grassBuffers.vertexCount);
}

function drawLine(renderInfo, modelMatrix, cameraPosition) {

	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	let cameraMatrixes = initCamera(renderInfo.gl, cameraPosition);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	// Draw the grass/ground
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coordsBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coordsBuffers.color);

	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.coordsBuffers.vertexCount);

}