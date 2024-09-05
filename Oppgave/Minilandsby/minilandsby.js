import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker ikke klasser, kun funksjoner.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	let cameraPosition = {x:0,y:500,z:-500}
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 1920, 1080);
	const gl = webGLCanvas.gl;
	let baseShaderInfo = initBaseShaders(gl);
	let renderInfo = {
		gl: webGLCanvas.gl,
		baseShaderInfo: initBaseShaders(webGLCanvas.gl),
		coordsBuffers: initCoordsBuffers(webGLCanvas.gl),
		cylinderBuffers: initCylinderBuffers(webGLCanvas.gl),
		grassBuffers: initGrassBuffers(webGLCanvas.gl),
		houseBuffers: initHouse(webGLCanvas.gl),
		coneBuffers: initCone(webGLCanvas.gl),
		triangleBuffers: initTriangle(webGLCanvas.gl),
		floorBuffers: initFloorBuffers(webGLCanvas.gl),
		thickLineBuffers: initThickLine(webGLCanvas.gl, 10, 100),
		triangleLineBuffers: initTriangleLine(webGLCanvas.gl, 10, 100),
	};
	draw(gl, baseShaderInfo, renderInfo, cameraPosition);
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
		draw(gl, baseShaderInfo, renderInfo, cameraPosition);
	}
	document.onkeydown = (e) => {
		if(e.code === "ArrowLeft"){
			let radius = (cameraPosition.x**2 + cameraPosition.z**2)**(1/2)
			let angle = Math.atan2(cameraPosition.z, cameraPosition.x);
			cameraPosition.x = Math.cos(angle - Math.PI/6) * radius
			cameraPosition.z = Math.sin(angle - Math.PI/6) * radius
		}
		if(e.code === "ArrowRight"){
			let radius = (cameraPosition.x**2 + cameraPosition.z**2)**(1/2)
			let angle = Math.atan2(cameraPosition.z, cameraPosition.x);
			cameraPosition.x = Math.cos(angle + Math.PI/6) * radius
			cameraPosition.z = Math.sin(angle + Math.PI/6) * radius
		}
		draw(gl, baseShaderInfo, renderInfo, cameraPosition);
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

function initHouse(gl) {
	// 8 hjørnepunkter i en kube
	const positions = new Float32Array([
		-1, -1, -1,  // 0: Venstre, bak, bunn
		1, -1, -1,  // 1: Høyre, bak, bunn
		1,  1, -1,  // 2: Høyre, bak, topp
		-1,  1, -1,  // 3: Venstre, bak, topp
		-1, -1,  1,  // 4: Venstre, front, bunn
		1, -1,  1,  // 5: Høyre, front, bunn
		1,  1,  1,  // 6: Høyre, front, topp
		-1,  1,  1   // 7: Venstre, front, topp
	]);

	// Farger for hvert hjørnepunkt
	const colors = new Float32Array([
		1, 0, 0, 1,  // Rød
		0, 1, 0, 1,  // Grønn
		0, 0, 1, 1,  // Blå
		1, 1, 0, 1,  // Gul
		1, 0, 1, 1,  // Magenta
		0, 1, 1, 1,  // Cyan
		1, 0.5, 0, 1, // Oransje
		0.5, 0, 0.5, 1  // Lilla
	]);

	// Indekser for å definere hver trekant i kuben
	const indices = new Uint16Array([
		0, 1, 2,   0, 2, 3,   // Bakside
		4, 5, 6,   4, 6, 7,   // Fremside
		3, 2, 6,   3, 6, 7,   // Topp
		0, 1, 5,   0, 5, 4,   // Bunn
		0, 3, 7,   0, 7, 4,   // Venstre
		1, 2, 6,   1, 6, 5    // Høyre
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		indices: indexBuffer,
		vertexCount: indices.length
	};
}

function initCylinderBuffers(gl) {
	let sectors = 12;
	let stepGrader = 360.0 / sectors;
	if (stepGrader <= 2)
		stepGrader = 3;
	let step = (Math.PI / 180) * stepGrader;

	let r = 0.68, g = 0.85, b = 0.90, a = 1.0; // Fargen på sylinderet
	let positionsArray = [];
	let colorsArray = [];

	let height = 10.0; // Høyden på sylinderen
	let radius = 0.5; // Radius på sylinderen

	// Generer toppsirkelen
	let x = 0, y = height / 2, z = 0; // Topp midtpunkt
	positionsArray = positionsArray.concat(x, y, z);
	colorsArray = colorsArray.concat(r, g, b, a);

	let phi = 0.0;

	// Create lines for the top circle
	for (let sector = 1; sector <= sectors + 1; sector++) {
		let x1 = radius * Math.cos(phi);
		let z1 = radius * Math.sin(phi);
		let x2 = radius * Math.cos(phi + step);
		let z2 = radius * Math.sin(phi + step);

		// Top circle
		positionsArray = positionsArray.concat(x1, height / 2, z1);
		positionsArray = positionsArray.concat(x2, height / 2, z2);

		// Bottom circle
		positionsArray = positionsArray.concat(x1, -height / 2, z1);
		positionsArray = positionsArray.concat(x2, -height / 2, z2);

		phi += step;
	}
	for (let sector = 1; sector <= sectors + 2; sector++) {
		x = radius * Math.cos(phi);
		y = height / 2;
		z = radius * Math.sin(phi);

		positionsArray = positionsArray.concat(x, y, z);
		colorsArray = colorsArray.concat(r, g, b, a);

		phi += step;
	}

	// Generer bunnsirkelen
	x = 0           // Bunn midtpunkt
	y = -height / 2 // Bunn midtpunkt
	z = 0;          // Bunn midtpunkt
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

function initFloorBuffers(gl) {
	// Define positions for the floor (two triangles forming a rectangle)
	const positions = new Float32Array([
		-5, 0, -5,  // Bottom left
		5, 0, -5,   // Bottom right
		5, 0, 5,    // Top right
		-5, 0, 5    // Top left
	]);

	// Define colors for the floor vertices
	const colors = new Float32Array([
		0.5, 0.3, 0.1, 1.0,  // Brown
		0.5, 0.3, 0.1, 1.0,  // Brown
		0.5, 0.3, 0.1, 1.0,  // Brown
		0.5, 0.3, 0.1, 1.0   // Brown
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

function initThickLine(gl, width, length) {
	const halfWidth = width / 2;
	const halfLength = length / 2;
	const positions = new Float32Array([
		-halfWidth, halfLength, 0.0,  // Top-left
		halfWidth, halfLength, 0.0,  // Top-right
		-halfWidth, -halfLength, 0.0, // Bottom-left
		halfWidth, -halfLength, 0.0  // Bottom-right
	]);

	const colors = new Float32Array([
		0.6, 0.6, 0.6, 1.0,  // Gray color
		0.6, 0.6, 0.6, 1.0,  // Gray color
		0.6, 0.6, 0.6, 1.0,  // Gray color
		0.6, 0.6, 0.6, 1.0   // Gray color
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

function initTriangleLine(gl, width, length) {
	const halfWidth = width / 2;
	const halfLength = length / 2;
	const positions = new Float32Array([
		// Triangle 1
		-halfWidth, halfLength, 0.0,  // Top-left
		halfWidth, halfLength, 0.0,  // Top-right
		-halfWidth, -halfLength, 0.0, // Bottom-left

		// Triangle 2
		halfWidth, halfLength, 0.0,  // Top-right
		halfWidth, -halfLength, 0.0, // Bottom-right
		-halfWidth, -halfLength, 0.0  // Bottom-left
	]);

	const colors = new Float32Array([
		0.6, 0.6, 0.6, 1.0,  // Gray color for top-left
		0.6, 0.6, 0.6, 1.0,  // Gray color for top-right
		0.6, 0.6, 0.6, 1.0,  // Gray color for bottom-left
		0.6, 0.6, 0.6, 1.0,  // Gray color for top-right
		0.6, 0.6, 0.6, 1.0,  // Gray color for bottom-right
		0.6, 0.6, 0.6, 1.0   // Gray color for bottom-left
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
		vertexCount: 6  // Two triangles, three vertices each
	};
}




function initTriangle(gl) {
	const positions = new Float32Array([
		//Triangle 1
		0.6, 0.6, 0,      // X Y Z
		0.4, -0.6, 0,  // X Y Z
		0.8, -0.6, 0,   // X Y Z
		//Triangle 2
		-0.6, 0.6, 0,      // X Y Z
		-0.4, -0.6, 0,  // X Y Z
		-0.8, -0.6, 0,   // X Y Z
		//Triangle 3
		0.2, -0.6, 0,   // X Y Z
		-0.2, -0.6, 0,   // X Y Z
		0.0, 0.6, 0.,    // X Y Z

	]);

	const colors = new Float32Array([
		//Triangle 1
		1.0, 0.2, 0.3, 1.0,      // R G B A
		0.2, 0.2, 1.0, 1.0,      // R G B A
		0.8, 0.6, 0, 1.0,      // R G B A
		//Triangle 2
		0.1, 0.2, 0.3, 1.0,      // R G B A
		0.2, 0.6, 0.5, 1.0,      // R G B A
		0.1, 0.5, 0.1, 1.0,      // R G B A
		//Triangle 3
		0.1, 0.3, 0.2, 1.0,      // R G B A
		0.1, 0.2, 0.4, 1.0,      // R G B A
		0.1, 0.1, 0.5, 1.0,      // R G B A

	]);
	const positionBuffer = gl.createBuffer();
	const colorBuffer = gl.createBuffer();
	// Kopler til
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Fyller
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	// Kopler fra
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	// Kopler til
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	// Fyller
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	// Kopler fra
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}

function initGrassBuffers(gl) {
	const extent =  700;

	// Positions for 6 points (each pair forms a line)
	const positions = new Float32Array([
		extent, -1, extent,
		-extent, -1, extent,
		extent, -1, -extent,
		-extent, -1, -extent,
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
		1, 1, 0, 1,  // Yellow
		1, 1, 0, 1,  // Yellow
		0, 0, 0, 1,  // Black
		0, 0, 0, 1   // Black
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


function draw(gl, baseShaderInfo, buffers, cameraPosition) {
	clearCanvas(gl);

	gl.useProgram(baseShaderInfo.program);

	// Draw the coordinate system first
	connectPositionAttribute(gl, baseShaderInfo, buffers.coordsBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.coordsBuffers.color);

	let cameraMatrixes = initCamera(gl, cameraPosition);

	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, cameraMatrixes.viewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	gl.drawArrays(gl.LINES, 0, buffers.coordsBuffers.vertexCount);


	// Draw the cylinder
	connectPositionAttribute(gl, baseShaderInfo, buffers.cylinderBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.cylinderBuffers.color);

	//gl.drawArrays(gl.TRIANGLE_FAN, 0, buffers.cylinderBuffers.vertexCount);

	// Draw the grass/ground
	connectPositionAttribute(gl, baseShaderInfo, buffers.grassBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.grassBuffers.color);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.grassBuffers.vertexCount);

	// Draw the cube
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.houseBuffers.indices);
	//gl.drawElements(gl.TRIANGLES, buffers.houseBuffers.vertexCount, gl.UNSIGNED_SHORT, 0);

	// Draw the triangle
	// connectPositionAttribute(gl, baseShaderInfo, buffers.triangleBuffers.position);
	// connectColorAttribute(gl, baseShaderInfo, buffers.triangleBuffers.color);


	// Draw the thick line
	//connectPositionAttribute(gl, baseShaderInfo, buffers.thickLineBuffers.position);
	//connectColorAttribute(gl, baseShaderInfo, buffers.thickLineBuffers.color);
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.thickLineBuffers.vertexCount);

	// Draw the triangle-based thick line
	connectPositionAttribute(gl, baseShaderInfo, buffers.triangleLineBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.triangleLineBuffers.color);
	gl.drawArrays(gl.TRIANGLES, 0, buffers.triangleLineBuffers.vertexCount);
}