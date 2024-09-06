import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker ikke klasser, kun funksjoner.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	let cameraPosition = {x:0,y:500,z:500}
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
		// draw(gl, baseShaderInfo, renderInfo, cameraPosition, windmillAngel);
	}
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

function initCamera(gl, eye = {x:0,y:0,z:0}) {
	let eyeX = eye.x, eyeY = eye.y, eyeZ = eye.z;
	let lookX = 0, lookY = 0, lookZ = 0;
	let upX = 0.0, upY = 1, upZ = 0;

	let viewMatrix = new Matrix4();
	let projectionMatrix = new Matrix4();

	viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);

	const fieldOfView = 10;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const near = 0.1;
	const far = 1000.0;
	projectionMatrix.setPerspective(fieldOfView, aspect, near, far);

	return {
		viewMatrix: viewMatrix,
		projectionMatrix: projectionMatrix
	};
}

function initCone(gl) {
	let positions = [];
	let colors = [];

	let sectors = 12;
	let stepGrader = 360 / sectors;
	let step = (Math.PI / 180) * stepGrader;
	let r = 1, g = 0, b = 0, a = 1; // Fargeverdier.

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
		-55, 0, -5,  // Top left
		55, 0, -5,   // Top right
		-55, 0, 5,    // bottom left
		55, 0, 5,    // Bottom right
		// Road 2
		-5, 0, -55,  // Top left
		5, 0, -55,   // Top right
		-5, 0, 55,    // bottom left
		5, 0, 55,    // Bottom right
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

function clearCanvas(gl) {
	gl.clearColor(0, 0.8, 1, 0.2);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function draw(gl, baseShaderInfo, buffers, cameraPosition, angle) {
	clearCanvas(gl);

	gl.useProgram(baseShaderInfo.program);

	// Draw the coordinate system first
	connectPositionAttribute(gl, baseShaderInfo, buffers.coordsBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.coordsBuffers.color);

	let cameraMatrixes = initCamera(gl, cameraPosition);

	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, cameraMatrixes.viewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	gl.drawArrays(gl.LINES, 0, buffers.coordsBuffers.vertexCount);

	// Draw the grass/ground
	connectPositionAttribute(gl, baseShaderInfo, buffers.grassBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.grassBuffers.color);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.grassBuffers.vertexCount);


	// Lag viewmodel-matrisa-propeller:
	let modelMatrix = new Matrix4();
//	// road
	modelMatrix.setIdentity();
	drawRoad(buffers, modelMatrix, cameraPosition);

	// Windmill
	modelMatrix.setIdentity();
	modelMatrix.translate(85,25, 10);
	modelMatrix.rotate(angle,0,0,1);
	modelMatrix.scale(0.8, 0.8 ,0)
	drawPropeller(buffers, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(85,25, 8.9);
	modelMatrix.rotate(90,1,0,0);
	drawCylinder(buffers, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(85,11, 7.5);
	modelMatrix.rotate(0,1,0,0);
	modelMatrix.scale(1,15,1);
	drawCylinder(buffers, modelMatrix, cameraPosition);

	// Hus 1
	modelMatrix.setIdentity();
	modelMatrix.translate(75,5, 25);
	modelMatrix.scale(5,5,5);
	drawCone(buffers, modelMatrix, cameraPosition);

	modelMatrix.setIdentity();
	modelMatrix.translate(75,0, 25);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(buffers, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});

	modelMatrix.setIdentity();
	modelMatrix.translate(70,0, 25);
	modelMatrix.scale(2.5,2.5,2.5);
	drawCube(buffers, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});


	// Hus 2
	modelMatrix.setIdentity();
	modelMatrix.translate(20,0, -60);
	modelMatrix.scale(2.5,5,2.5);
	drawCube(buffers, modelMatrix, cameraPosition, {red: 0.95, green: 0.67, blue: 0.52, alpha: 1.0});

	modelMatrix.setIdentity();
	modelMatrix.translate(25,0, -60);
	modelMatrix.scale(2.5,2.5,2.5);
	drawCube(buffers, modelMatrix, cameraPosition, {red: 0.95, green: 0.85, blue: 0.2, alpha: 1.0});

	modelMatrix.setIdentity();
	modelMatrix.translate(15,0, -60);
	modelMatrix.scale(2.5,3,2.5);
	drawCube(buffers, modelMatrix, cameraPosition, {red: 0.55, green: 0.85, blue: 0.45, alpha: 1.0});

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

