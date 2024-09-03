import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker ikke klasser, kun funksjoner.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	const gl = webGLCanvas.gl;
	let baseShaderInfo = initBaseShaders(gl);
	let buffers = initBuffers(gl);
	draw(gl, baseShaderInfo, buffers);
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


/**
 * Genererer view- og projeksjonsmatrisene.
 * Disse utgjør tilsanmmen det virtuelle kameraet.
 */
// Example of a slight camera position adjustment
function initCamera(gl) {
	let eyeX = 7, eyeY = 7, eyeZ = 10;  // Slight offset to make the blue line visible
	let lookX = 0, lookY = 0, lookZ = 0;

	let upX = 0, upY = 1, upZ = 0;

	let viewMatrix = new Matrix4();
	let projectionMatrix = new Matrix4();

	viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);

	const fieldOfView = 60;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const near = 0.1;
	const far = 1000.0;
	projectionMatrix.setPerspective(fieldOfView, aspect, near, far);

	return {
		viewMatrix: viewMatrix,
		projectionMatrix: projectionMatrix
	};
}


/**
 * Oppretter verteksbuffer for trekanten.
 * Et posisjonsbuffer og et fargebuffer.
 * MERK: Må være likt antall posisjoner og farger.
 */
function initBuffers(gl) {
	let sectors = 12;
	let stepGrader = 360.0 / sectors;
	if (stepGrader <= 2)
		stepGrader = 3;
	let step = (Math.PI / 180) * stepGrader;
	let r = 0.8, g = 0.50, b = 0.3, a = 1.0;
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



function initCoordBuffer(gl) {
	const extent =  100;

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
		0, 1, 0, 1,  // Green
		0, 1, 0, 1,  // Green
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




/**
 * Aktiverer position-bufferet.
 * Kalles fra draw()
 */
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

/**
 * Aktiverer color-bufferet.
 * Kalles fra draw()
 */
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

/**
 * Klargjør canvaset.
 * Kalles fra draw()
 */
function clearCanvas(gl) {
	gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Tegner!
 *
 */
function draw(gl, baseShaderInfo, buffers) {
	clearCanvas(gl);

	gl.useProgram(baseShaderInfo.program);

	// Tegn koordinatsystemet først
	const coordBuffers = initCoordBuffer(gl);
	connectPositionAttribute(gl, baseShaderInfo, coordBuffers.position);
	connectColorAttribute(gl, baseShaderInfo, coordBuffers.color);

	let coordMatrix = new Matrix4();
	coordMatrix.setIdentity();
	let cameraMatrixes = initCamera(gl);
	let coordViewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(coordMatrix));

	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, coordViewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	gl.drawArrays(gl.LINES, 0, coordBuffers.vertexCount);  // Tegner koordinatsystemet som linjer

	// Tegn sylinderen
	connectPositionAttribute(gl, baseShaderInfo, buffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.color);

	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.rotate(45, 0, 1, 0);  // Rotate around Y-axis to give a better perspective

	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, buffers.vertexCount);  // Tegner sylinderen
}

